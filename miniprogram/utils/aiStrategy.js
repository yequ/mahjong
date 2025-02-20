const mahjongRules = require('./mahjongRules.js');

// AI策略实现
const AiStrategy = {
  // 计算牌的危险度（0-100）
  calculateDangerLevel: function(tile, discardedTiles, otherPlayersTiles) {
    let dangerLevel = 0;
    
    // 计算已经打出的同样的牌的数量
    const sameDiscarded = discardedTiles.filter(t => t === tile).length;
    dangerLevel += sameDiscarded * 20; // 每张相同的牌增加20点危险度
    
    // 计算与其相邻的牌的数量
    const suit = tile.slice(-1);
    const value = parseInt(tile);
    if (suit === '万' || suit === '筒' || suit === '条') {
      const nearby = discardedTiles.filter(t => {
        const tValue = parseInt(t);
        const tSuit = t.slice(-1);
        return tSuit === suit && Math.abs(tValue - value) <= 2;
      }).length;
      dangerLevel += nearby * 10; // 每张相邻的牌增加10点危险度
    }
    
    // 根据其他玩家的动作判断危险度
    for (const player of otherPlayersTiles) {
      if (player.ting) {
        dangerLevel += 50; // 如果有人听牌，大幅增加危险度
      }
      if (player.peng.includes(tile)) {
        dangerLevel += 30; // 如果有人碰过这张牌，增加危险度
      }
    }
    
    return Math.min(dangerLevel, 100);
  },

  // 计算牌的进张数
  calculateTileEfficiency: function(tiles, discardedTiles) {
    const efficiency = {};
    const allTiles = mahjongRules.getAllPossibleTiles();
    
    // 对每张牌计算打出后的进张数
    for (const tile of tiles) {
      const remainingTiles = [...tiles];
      remainingTiles.splice(remainingTiles.indexOf(tile), 1);
      
      let tingCount = 0;
      for (const testTile of allTiles) {
        // 排除已经打出的牌
        if (discardedTiles.filter(t => t === testTile).length >= 4) continue;
        
        if (mahjongRules.checkHu([...remainingTiles, testTile]).canHu) {
          tingCount++;
        }
      }
      
      efficiency[tile] = tingCount;
    }
    
    return efficiency;
  },

  // 判断是否应该碰牌
  shouldPeng: function(tiles, targetTile, discardedTiles, remainingCount) {
    // 如果剩余牌数较少，倾向于不碰
    if (remainingCount < 20) return false;
    
    // 计算碰牌后的进张数
    const tilesAfterPeng = [...tiles];
    tilesAfterPeng.splice(tilesAfterPeng.indexOf(targetTile), 2);
    const efficiencyAfterPeng = this.calculateTileEfficiency(tilesAfterPeng, discardedTiles);
    
    // 计算当前进张数
    const currentEfficiency = this.calculateTileEfficiency(tiles, discardedTiles);
    
    // 如果碰牌后进张数明显增加，则碰
    return Math.max(...Object.values(efficiencyAfterPeng)) > 
           Math.max(...Object.values(currentEfficiency)) * 1.5;
  },

  // 判断是否应该杠牌
  shouldGang: function(tiles, targetTile, discardedTiles, remainingCount) {
    // 如果剩余牌数较少，不建议杠
    if (remainingCount < 20) return false;
    
    // 检查是否会破坏听牌
    const tilesAfterGang = [...tiles];
    tilesAfterGang.splice(tilesAfterGang.indexOf(targetTile), 3);
    const tingTilesAfterGang = mahjongRules.getTingTiles(tilesAfterGang);
    
    return tingTilesAfterGang.length > 0;
  },

  // 选择最佳的出牌
  getBestDiscard: function(tiles, discardedTiles, otherPlayersTiles, remainingCount) {
    const efficiency = this.calculateTileEfficiency(tiles, discardedTiles);
    const dangerLevels = {};
    
    // 计算每张牌的危险度
    for (const tile of tiles) {
      dangerLevels[tile] = this.calculateDangerLevel(tile, discardedTiles, otherPlayersTiles);
    }
    
    // 综合考虑进张数和危险度
    let bestTile = tiles[0];
    let bestScore = -Infinity;
    
    for (const tile of tiles) {
      const score = efficiency[tile] * (100 - dangerLevels[tile]) / 100;
      if (score > bestScore) {
        bestScore = score;
        bestTile = tile;
      }
    }
    
    return bestTile;
  },

  // 获取AI的行动决策
  getAction: function(tiles, discardedTiles, otherPlayersTiles, remainingCount, lastDiscardTile) {
    // 检查是否可以胡牌
    if (lastDiscardTile && mahjongRules.checkHu([...tiles, lastDiscardTile]).canHu) {
      return { action: 'hu' };
    }
    
    // 检查是否可以杠
    if (lastDiscardTile && mahjongRules.canGang(tiles, lastDiscardTile)) {
      if (this.shouldGang(tiles, lastDiscardTile, discardedTiles, remainingCount)) {
        return { action: 'gang', tile: lastDiscardTile };
      }
    }
    
    // 检查是否可以碰
    if (lastDiscardTile && mahjongRules.canPeng(tiles, lastDiscardTile)) {
      if (this.shouldPeng(tiles, lastDiscardTile, discardedTiles, remainingCount)) {
        return { action: 'peng', tile: lastDiscardTile };
      }
    }
    
    // 选择出牌
    const discardTile = this.getBestDiscard(tiles, discardedTiles, otherPlayersTiles, remainingCount);
    return { action: 'discard', tile: discardTile };
  }
};

module.exports = AiStrategy;
