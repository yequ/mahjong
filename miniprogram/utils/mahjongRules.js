// 麻将规则和算法工具类
const MahjongRules = {
  // 检查是否可以碰
  canPeng: function(hand, tile) {
    const count = hand.filter(t => t === tile).length;
    return count >= 2;
  },

  // 检查是否可以明杠
  canMingGang: function(hand, tile) {
    const count = hand.filter(t => t === tile).length;
    return count >= 3;
  },

  // 检查是否可以暗杠
  canAnGang: function(hand, tile) {
    const count = hand.filter(t => t === tile).length;
    return count === 4;
  },

  // 检查是否可以补杠
  canBuGang: function(hand, pengTiles, tile) {
    return pengTiles.includes(tile) && hand.includes(tile);
  },

  // 检查是否可以抢杠胡
  canQiangGangHu: function(hand, gangTile) {
    const tmpHand = [...hand, gangTile];
    const result = this.canHu(tmpHand);
    if (result.canHu) {
      return {
        canHu: true,
        pattern: '抢杠胡',
        score: 40
      };
    }
    return {
      canHu: false,
      pattern: '',
      score: 0
    };
  },

  // 检查是否杠上开花
  canGangShangKaiHua: function(hand, newTile) {
    const tmpHand = [...hand, newTile];
    const result = this.canHu(tmpHand);
    if (result.canHu) {
      return {
        canHu: true,
        pattern: '杠上开花',
        score: 40
      };
    }
    return {
      canHu: false,
      pattern: '',
      score: 0
    };
  },

  // 检查清一色
  isQingYiSe: function(tiles) {
    if (tiles.length === 0) return false;
    const suit = tiles[0].slice(-1);
    return tiles.every(tile => tile.slice(-1) === suit);
  },

  // 检查是否胡牌
  canHu: function(hand) {
    // 复制手牌进行分析
    const tiles = [...hand].sort();
    
    // 检查清一色
    if (this.isQingYiSe(tiles)) {
      return {
        canHu: true,
        pattern: '清一色',
        score: 32
      };
    }
    
    // 检查七对子
    if (this.isQiDui(tiles)) {
      if (this.isQingYiSe(tiles)) {
        return {
          canHu: true,
          pattern: '清一色七对',
          score: 64
        };
      }
      return {
        canHu: true,
        pattern: '七对子',
        score: 24
      };
    }

    // 检查十三幺
    if (this.isShiSanYao(tiles)) {
      return {
        canHu: true,
        pattern: '十三幺',
        score: 88
      };
    }

    // 检查普通胡牌
    if (this.isNormalHu(tiles)) {
      return {
        canHu: true,
        pattern: '平胡',
        score: 8
      };
    }

    return {
      canHu: false,
      pattern: '',
      score: 0
    };
  },

  // 检查七对子
  isQiDui: function(tiles) {
    if (tiles.length !== 14) return false;
    
    for (let i = 0; i < tiles.length; i += 2) {
      if (tiles[i] !== tiles[i + 1]) return false;
    }
    return true;
  },

  // 检查十三幺
  isShiSanYao: function(tiles) {
    if (tiles.length !== 14) return false;
    
    const yaoJiu = [
      '1万', '9万', '1筒', '9筒', '1条', '9条'
    ];
    
    // 检查是否包含所有幺九牌
    for (const yao of yaoJiu) {
      if (!tiles.includes(yao)) return false;
    }
    
    // 检查是否有对子
    const tileCount = {};
    for (const tile of tiles) {
      tileCount[tile] = (tileCount[tile] || 0) + 1;
    }
    
    let hasPair = false;
    for (const [tile, count] of Object.entries(tileCount)) {
      if (count === 2) {
        if (hasPair) return false;
        hasPair = true;
      } else if (count !== 1) {
        return false;
      }
    }
    
    return hasPair;
  },

  // 检查普通胡牌
  isNormalHu: function(tiles) {
    if (tiles.length % 3 !== 2) return false;

    // 尝试每种牌作为将牌
    const uniqueTiles = [...new Set(tiles)];
    for (const pair of uniqueTiles) {
      const tmpTiles = [...tiles];
      // 移除对子
      const pairCount = tmpTiles.filter(t => t === pair).length;
      if (pairCount < 2) continue;
      
      // 移除两张作为对子
      tmpTiles.splice(tmpTiles.indexOf(pair), 1);
      tmpTiles.splice(tmpTiles.indexOf(pair), 1);

      // 检查剩余牌是否都是顺子或刻子
      if (this.checkRemaining(tmpTiles)) {
        return true;
      }
    }
    return false;
  },

  // 检查剩余牌是否都是顺子或刻子
  checkRemaining: function(tiles) {
    if (tiles.length === 0) return true;
    
    // 检查刻子
    if (tiles[0] === tiles[1] && tiles[1] === tiles[2]) {
      return this.checkRemaining(tiles.slice(3));
    }
    
    // 检查顺子
    const idx1 = tiles.indexOf(tiles[0]);
    const idx2 = tiles.indexOf(parseInt(tiles[0]) + 1);
    const idx3 = tiles.indexOf(parseInt(tiles[0]) + 2);
    
    if (idx1 !== -1 && idx2 !== -1 && idx3 !== -1) {
      const newTiles = [...tiles];
      newTiles.splice(idx3, 1);
      newTiles.splice(idx2, 1);
      newTiles.splice(idx1, 1);
      return this.checkRemaining(newTiles);
    }
    
    return false;
  },

  // 计算得分
  calculateScore: function(pattern, extraPatterns = []) {
    const scoreTable = {
      '平胡': 8,
      '七对子': 24,
      '清一色': 32,
      '清一色七对': 64,
      '杠上开花': 40,
      '抢杠胡': 40,
      '十三幺': 88,
      '自摸': 8,
      '杠': 8,
      '明杠': 12,
      '暗杠': 16
    };

    let totalScore = scoreTable[pattern] || 0;
    
    // 计算额外番数
    for (const extra of extraPatterns) {
      totalScore += scoreTable[extra] || 0;
    }
    
    return totalScore;
  }
};

// 麻将规则实现
const FAN_TYPES = {
  PING_HU: { name: '平胡', score: 8 },
  QI_DUI: { name: '七对子', score: 24 },
  QING_YI_SE: { name: '清一色', score: 32 },
  QING_QI_DUI: { name: '清一色七对', score: 64 },
  SHI_SAN_YAO: { name: '十三幺', score: 88 },
  ZI_MO: { name: '自摸', score: 8 },
  GANG_SHANG_HUA: { name: '杠上开花', score: 40 },
  QIANG_GANG_HU: { name: '抢杠胡', score: 40 },
  MING_GANG: { name: '明杠', score: 12 },
  AN_GANG: { name: '暗杠', score: 16 }
};

// 初始化麻将牌
function initTiles() {
  const tiles = [];
  // 万、筒、条
  for (let suit of ['万', '筒', '条']) {
    for (let i = 1; i <= 9; i++) {
      for (let j = 0; j < 4; j++) {
        tiles.push(i + suit);
      }
    }
  }
  // 洗牌
  return shuffleTiles(tiles);
}

// 洗牌算法
function shuffleTiles(tiles) {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

// 检查是否可以碰牌
function canPeng(tiles, targetTile) {
  return tiles.filter(t => t === targetTile).length >= 2;
}

// 检查是否可以杠牌
function canGang(tiles, targetTile) {
  return tiles.filter(t => t === targetTile).length >= 3;
}

// 检查是否可以暗杠
function canAnGang(tiles) {
  const count = {};
  for (const tile of tiles) {
    count[tile] = (count[tile] || 0) + 1;
  }
  return Object.values(count).some(c => c === 4);
}

// 检查是否可以抢杠胡
function canQiangGangHu(tiles, gangTile) {
  return checkHu([...tiles, gangTile]);
}

// 获取所有听牌
function getTingTiles(tiles) {
  const tingTiles = [];
  const allTiles = getAllPossibleTiles();
  
  for (const tile of allTiles) {
    if (checkHu([...tiles, tile])) {
      tingTiles.push(tile);
    }
  }
  return tingTiles;
}

// 获取所有可能的牌
function getAllPossibleTiles() {
  const tiles = [];
  for (let i = 1; i <= 9; i++) {
    tiles.push(i + '万', i + '筒', i + '条');
  }
  return tiles;
}

// 检查和牌并计算番数
function checkHu(tiles) {
  const sortedTiles = [...tiles].sort();
  const fans = [];
  
  // 检查十三幺
  if (isShiSanYao(sortedTiles)) {
    fans.push(FAN_TYPES.SHI_SAN_YAO);
    return { canHu: true, fans };
  }
  
  // 检查七对子
  if (isQiDui(sortedTiles)) {
    fans.push(FAN_TYPES.QI_DUI);
    // 检查清一色七对
    if (isQingYiSe(sortedTiles)) {
      fans.push(FAN_TYPES.QING_QI_DUI);
    }
    return { canHu: true, fans };
  }
  
  // 检查普通和牌
  if (isPingHu(sortedTiles)) {
    fans.push(FAN_TYPES.PING_HU);
    // 检查清一色
    if (isQingYiSe(sortedTiles)) {
      fans.push(FAN_TYPES.QING_YI_SE);
    }
    return { canHu: true, fans };
  }
  
  return { canHu: false, fans: [] };
}

// 检查是否是平胡
function isPingHu(tiles) {
  // 复制牌组进行分析
  const sortedTiles = [...tiles].sort();
  
  // 找对子
  for (let i = 0; i < sortedTiles.length - 1; i++) {
    if (sortedTiles[i] === sortedTiles[i + 1]) {
      const remaining = [...sortedTiles];
      remaining.splice(i, 2);
      if (canFormMelds(remaining)) {
        return true;
      }
    }
  }
  return false;
}

// 检查是否可以组成顺子或刻子
function canFormMelds(tiles) {
  if (tiles.length === 0) return true;
  
  const sortedTiles = [...tiles].sort();
  
  // 检查刻子
  if (tiles.length >= 3 && 
      sortedTiles[0] === sortedTiles[1] && 
      sortedTiles[1] === sortedTiles[2]) {
    return canFormMelds(sortedTiles.slice(3));
  }
  
  // 检查顺子
  const first = sortedTiles[0];
  const suit = first.slice(-1);
  const value = parseInt(first);
  
  if (suit === '万' || suit === '筒' || suit === '条') {
    const second = `${value + 1}${suit}`;
    const third = `${value + 2}${suit}`;
    
    const secondIndex = sortedTiles.indexOf(second);
    const thirdIndex = sortedTiles.indexOf(third);
    
    if (secondIndex !== -1 && thirdIndex !== -1) {
      const remaining = [...sortedTiles];
      remaining.splice(thirdIndex, 1);
      remaining.splice(secondIndex, 1);
      remaining.splice(0, 1);
      if (canFormMelds(remaining)) {
        return true;
      }
    }
  }
  
  return false;
}

// 检查是否是七对子
function isQiDui(tiles) {
  if (tiles.length !== 14) return false;
  
  const sortedTiles = [...tiles].sort();
  for (let i = 0; i < 14; i += 2) {
    if (sortedTiles[i] !== sortedTiles[i + 1]) {
      return false;
    }
  }
  return true;
}

// 检查是否是清一色
function isQingYiSe(tiles) {
  const suit = tiles[0].slice(-1);
  return tiles.every(tile => tile.slice(-1) === suit);
}

// 检查是否是十三幺
function isShiSanYao(tiles) {
  if (tiles.length !== 14) return false;
  
  const yaojiu = ['1万', '9万', '1筒', '9筒', '1条', '9条'];
  const sortedTiles = [...tiles].sort();
  
  // 检查是否包含所有幺九牌
  for (const yao of yaojiu) {
    if (!sortedTiles.includes(yao)) {
      return false;
    }
  }
  
  // 检查是否有对子
  for (let i = 0; i < sortedTiles.length - 1; i++) {
    if (sortedTiles[i] === sortedTiles[i + 1]) {
      return yaojiu.includes(sortedTiles[i]);
    }
  }
  
  return false;
}

// 计算总分
function calculateTotalScore(fans, isZimo = false, isGangShangHua = false, isQiangGangHu = false) {
  let totalScore = 0;
  let totalFan = 0;
  
  // 计算基本番数
  for (const fan of fans) {
    totalScore += fan.score;
    totalFan++;
  }
  
  // 额外番数
  if (isZimo) {
    totalScore += FAN_TYPES.ZI_MO.score;
    totalFan++;
  }
  
  if (isGangShangHua) {
    totalScore += FAN_TYPES.GANG_SHANG_HUA.score;
    totalFan++;
  }
  
  if (isQiangGangHu) {
    totalScore += FAN_TYPES.QIANG_GANG_HU.score;
    totalFan++;
  }
  
  return { totalScore, totalFan };
}

module.exports = {
  MahjongRules,
  FAN_TYPES,
  initTiles,
  canPeng,
  canGang,
  canAnGang,
  canQiangGangHu,
  getTingTiles,
  checkHu,
  calculateTotalScore
};
