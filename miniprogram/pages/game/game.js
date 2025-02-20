// 麻将牌的定义
const TILES = {
  CHARACTERS: ['1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万'],
  DOTS: ['1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒'],
  BAMBOO: ['1条', '2条', '3条', '4条', '5条', '6条', '7条', '8条', '9条']
};

// 判断是否可以碰牌
function canPengTile(tiles, targetTile) {
  let count = 0;
  for (let tile of tiles) {
    if (tile === targetTile) count++;
  }
  return count >= 2;
}

// 判断是否可以杠牌
function canGangTile(tiles, targetTile) {
  let count = 0;
  for (let tile of tiles) {
    if (tile === targetTile) count++;
  }
  return count >= 3;
}

// 判断是否可以暗杠
function canAnGang(tiles) {
  const tileCount = {};
  for (let tile of tiles) {
    tileCount[tile] = (tileCount[tile] || 0) + 1;
  }
  return Object.values(tileCount).some(count => count === 4);
}

// 检查是否胡牌
function checkHu(tiles) {
  // 复制牌组进行分析
  const sortedTiles = [...tiles].sort();
  
  // 计算每种牌的数量
  const tileCount = {};
  for (let tile of sortedTiles) {
    tileCount[tile] = (tileCount[tile] || 0) + 1;
  }
  
  // 检查对子
  const pairs = Object.entries(tileCount).filter(([_, count]) => count >= 2);
  
  // 对每个可能的对子尝试胡牌判定
  for (let [pair, _] of pairs) {
    const remainingTiles = [...sortedTiles];
    // 移除对子
    remainingTiles.splice(remainingTiles.indexOf(pair), 1);
    remainingTiles.splice(remainingTiles.indexOf(pair), 1);
    
    if (canFormMelds(remainingTiles)) {
      return true;
    }
  }
  
  return false;
}

// 检查是否可以组成顺子或刻子
function canFormMelds(tiles) {
  if (tiles.length === 0) return true;
  
  const sortedTiles = [...tiles].sort();
  
  // 尝试组成刻子
  if (tiles.length >= 3) {
    const first = sortedTiles[0];
    if (sortedTiles[1] === first && sortedTiles[2] === first) {
      const remaining = sortedTiles.slice(3);
      if (canFormMelds(remaining)) return true;
    }
  }
  
  // 尝试组成顺子
  if (tiles.length >= 3) {
    const first = sortedTiles[0];
    const suit = first.slice(-1); // 获取牌的花色（万、筒、条）
    if (suit === '万' || suit === '筒' || suit === '条') {
      const value = parseInt(first);
      if (value <= 7) { // 确保可以组成顺子
        const second = `${value + 1}${suit}`;
        const third = `${value + 2}${suit}`;
        const secondIndex = sortedTiles.indexOf(second);
        const thirdIndex = sortedTiles.indexOf(third);
        if (secondIndex !== -1 && thirdIndex !== -1) {
          const remaining = [...sortedTiles];
          remaining.splice(thirdIndex, 1);
          remaining.splice(secondIndex, 1);
          remaining.splice(0, 1);
          if (canFormMelds(remaining)) return true;
        }
      }
    }
  }
  
  return false;
}

// 检查听牌
function checkTing(tiles) {
  const tingTiles = [];
  const allPossibleTiles = [
    ...TILES.CHARACTERS,
    ...TILES.DOTS,
    ...TILES.BAMBOO
  ];
  
  // 对每个可能的牌检查是否能胡
  for (let tile of allPossibleTiles) {
    const testTiles = [...tiles, tile];
    if (checkHu(testTiles)) {
      tingTiles.push(tile);
    }
  }
  
  return tingTiles;
}

const mahjongRules = require('../../utils/mahjongRules.js');
const aiStrategy = require('../../utils/aiStrategy.js');

Page({
  data: {
    // 游戏设置
    totalRounds: 4,
    currentRound: 1,
    baseScore: 1,
    
    // 玩家信息
    players: [
      { name: '自家', score: 0, isDealer: false, direction: '南' },
      { name: '下家', score: 0, isDealer: false, direction: '西' },
      { name: '对家', score: 0, isDealer: false, direction: '北' },
      { name: '上家', score: 0, isDealer: false, direction: '东' }
    ],
    currentPlayer: 0,
    
    // 牌局信息
    remainingTiles: [],
    discardTiles: [],
    playerTiles: [],
    leftPlayerTiles: [],
    topPlayerTiles: [],
    rightPlayerTiles: [],
    
    // 玩家操作状态
    canPeng: false,
    canGang: false,
    canHu: false,
    canPass: false,
    selectedTileIndex: -1,
    
    // 听牌信息
    tingTiles: [],
    
    // 结算信息
    showSettlement: false,
    
    // 流局相关
    showDrawCountdown: false,
    minTilesForDraw: 16,  // 当剩余牌小于这个数时显示流局提示
    
    // 游戏状态相关
    stateText: {
      'waiting': '等待开始',
      'playing': '游戏进行中',
      'finished': '游戏结束'
    },
    gameState: {
      phase: 'waiting',
      wind: '东',
      lastAction: '',
      turnTimeLeft: 10
    },
    
    // 玩家方位
    directions: ['东', '南', '西', '北'],
  },

  onLoad: function() {
    // 初始化游戏状态
    this.setData({
      'gameState.phase': 'waiting',
      'gameState.wind': '东',
      currentRound: 1,
      players: [
        { name: '自家', score: 0, isDealer: false, direction: '南' },
        { name: '下家', score: 0, isDealer: false, direction: '西' },
        { name: '对家', score: 0, isDealer: false, direction: '北' },
        { name: '上家', score: 0, isDealer: false, direction: '东' }
      ]
    });

    // 加载游戏设置
    const settings = wx.getStorageSync('gameSettings') || {};
    this.setData({
      totalRounds: settings.totalRounds || 4,
      baseScore: settings.baseScore || 1
    });
    
    // 设置庄家
    const dealerIndex = settings.dealer === '自家' ? 0 
      : settings.dealer === '下家' ? 1 
      : settings.dealer === '对家' ? 2 
      : settings.dealer === '上家' ? 3 
      : Math.floor(Math.random() * 4);
    
    this.setDealer(dealerIndex);
  },

  // 设置庄家
  setDealer: function(index) {
    const players = this.data.players;
    players.forEach((p, i) => {
      p.isDealer = (i === index);
    });
    this.setData({ 
      players,
      currentPlayer: index
    });
  },

  // 开始游戏
  startGame: function() {
    if (this.data.gameState.phase !== 'waiting') return;
    
    // 初始化牌局
    const tiles = this.shuffleTiles();
    
    // 发牌
    this.setData({
      remainingTiles: tiles.slice(52),  // 剩余的牌
      discardTiles: [],  // 清空牌河
      playerTiles: tiles.slice(0, 13).sort(),  // 玩家的牌
      leftPlayerTiles: tiles.slice(13, 26),    // 左家的牌
      topPlayerTiles: tiles.slice(26, 39),     // 对家的牌
      rightPlayerTiles: tiles.slice(39, 52),   // 右家的牌
      selectedTileIndex: -1,  // 重置选中的牌
      
      // 重置操作状态
      canPeng: false,
      canGang: false,
      canHu: false,
      canPass: false,
      
      // 更新游戏状态
      'gameState.phase': 'playing',
      'gameState.lastAction': '游戏开始',
      'gameState.turnTimeLeft': 10
    });

    // 如果玩家不是庄家，让AI开始行动
    if (!this.data.players[0].isDealer) {
      setTimeout(() => {
        this.aiAction();
      }, 1000);
    }
  },

  // 洗牌函数
  shuffleTiles: function() {
    const tiles = [];
    // 万筒条
    for (let i = 1; i <= 9; i++) {
      for (let j = 0; j < 4; j++) {
        tiles.push(i + '万', i + '筒', i + '条');
      }
    }
    
    // 打乱牌序
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    return tiles;
  },

  // 返回设置页面
  backToSettings: function() {
    wx.navigateBack();
  },

  // 初始化游戏
  initGame: function() {
    // 初始化牌局
    const tiles = this.shuffleTiles();
    
    // 发牌
    this.setData({
      remainingTiles: tiles.slice(52),  // 剩余的牌
      discardTiles: [],  // 清空牌河
      playerTiles: tiles.slice(0, 13).sort(),  // 玩家的牌
      leftPlayerTiles: tiles.slice(13, 26),  // 左家的牌
      topPlayerTiles: tiles.slice(26, 39),  // 对家的牌
      rightPlayerTiles: tiles.slice(39, 52),  // 右家的牌
      selectedTileIndex: -1,  // 重置选中的牌
      
      // 重置操作状态
      canPeng: false,
      canGang: false,
      canHu: false,
      canPass: false,
    });
  },

  checkTing: function() {
    const tingTiles = mahjongRules.getTingTiles(this.data.playerTiles);
    this.setData({ tingTiles });
  },

  selectTile: function(e) {
    const index = e.currentTarget.dataset.index;
    // 只有在当前玩家回合才能选牌
    if (this.data.currentPlayer !== 0) return;
    
    this.setData({
      selectedTileIndex: index
    });
    
    // 选中牌后自动触发出牌
    this.discardTile();
  },

  // 出牌
  discardTile: function() {
    const index = this.data.selectedTileIndex;
    if (index === -1 || this.data.currentPlayer !== 0) return;
    
    const playerTiles = this.data.playerTiles;
    const discardedTile = playerTiles[index];
    
    // 从手牌中移除
    playerTiles.splice(index, 1);
    
    // 添加到牌河
    const discardTiles = this.data.discardTiles;
    discardTiles.push({
      tile: discardedTile,
      player: 0,
      highlighted: false
    });
    
    // 更新数据
    this.setData({
      playerTiles: playerTiles.sort(),
      discardTiles: discardTiles,
      selectedTileIndex: -1,
      currentPlayer: 1  // 轮到下一个玩家
    });
    
    // 检查其他玩家是否可以碰、杠、胡
    this.checkOtherPlayersActions(discardedTile);
    
    // 如果没有玩家可以操作，让AI继续
    if (!this.data.canPeng && !this.data.canGang && !this.data.canHu) {
      setTimeout(() => {
        this.aiAction();
      }, 1000);
    }
    
    // 更新游戏状态
    const gameState = this.data.gameState;
    gameState.currentTurn = this.data.currentPlayer;
    gameState.lastAction = `${this.data.players[this.data.currentPlayer].name}打出${discardedTile}`;
    gameState.isThinking = true;
    this.setData({ gameState });
  },

  // 流局处理
  onDraw: function() {
    // 流局时，庄家连庄
    const currentDealer = this.data.players.findIndex(p => p.isDealer);
    
    this.setData({
      showSettlement: true,
      'players': this.data.players.map(player => ({
        ...player,
        roundScore: 0
      }))
    });
  },

  // 下一局
  nextRound: function() {
    if (this.data.currentRound < this.data.totalRounds) {
      this.setData({
        currentRound: this.data.currentRound + 1,
        showSettlement: false
      });
      this.initGame();
    } else {
      // 游戏结束，显示最终结算
      this.showFinalSettlement();
    }
  },

  // 显示最终结算
  showFinalSettlement: function() {
    wx.showModal({
      title: '游戏结束',
      content: this.data.players.map(player => 
        `${player.name}: ${player.score}分`
      ).join('\n'),
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },

  // AI相关逻辑
  aiAction: function() {
    if (this.data.currentPlayer === 0) return;
    
    setTimeout(() => {
      // 获取当前AI玩家的手牌
      let aiTiles;
      switch(this.data.currentPlayer) {
        case 1: aiTiles = this.data.leftPlayerTiles; break;
        case 2: aiTiles = this.data.topPlayerTiles; break;
        case 3: aiTiles = this.data.rightPlayerTiles; break;
      }
      
      // 使用AI策略决定出牌
      const decision = aiStrategy.getAction(
        aiTiles,
        this.data.discardTiles,
        this.data.remainingTiles.length
      );
      
      // 执行AI的决定
      if (decision.action === 'discard') {
        // AI出牌逻辑
        this.aiDiscard(decision.tile);
      }
      // 可以添加其他AI动作（碰、杠、胡）的处理
    }, 1000); // 延迟1秒，模拟思考时间
  },

  // AI出牌
  aiDiscard: function(tile) {
    let aiTiles;
    switch(this.data.currentPlayer) {
      case 1:
        aiTiles = [...this.data.leftPlayerTiles];
        aiTiles.splice(aiTiles.indexOf(tile), 1);
        this.setData({ leftPlayerTiles: aiTiles });
        break;
      case 2:
        aiTiles = [...this.data.topPlayerTiles];
        aiTiles.splice(aiTiles.indexOf(tile), 1);
        this.setData({ topPlayerTiles: aiTiles });
        break;
      case 3:
        aiTiles = [...this.data.rightPlayerTiles];
        aiTiles.splice(aiTiles.indexOf(tile), 1);
        this.setData({ rightPlayerTiles: aiTiles });
        break;
    }
    
    const discardTiles = [...this.data.discardTiles, tile];
    this.setData({
      discardTiles,
      currentPlayer: (this.data.currentPlayer + 1) % 4
    });
    
    // 检查玩家是否可以碰、杠、胡
    if (this.data.currentPlayer === 0) {
      this.checkPlayerActions(tile);
    }
  },

  // 检查玩家动作
  checkPlayerActions: function(tile) {
    const canPeng = mahjongRules.canPeng(this.data.playerTiles, tile);
    const canGang = mahjongRules.canGang(this.data.playerTiles, tile);
    const canHu = mahjongRules.canHu([...this.data.playerTiles, tile]);
    
    this.setData({
      canPeng,
      canGang,
      canHu,
      canPass: canPeng || canGang || canHu
    });
  },

  // 检查其他玩家动作
  checkOtherPlayersActions: function(tile) {
    // 这里可以添加其他玩家的碰、杠、胡判定
    // 现在先简单处理，直接轮到下家
    this.aiAction();
  },

  // 玩家操作响应
  onPeng: function() {
    // 实现碰牌逻辑
  },

  onGang: function() {
    // 实现杠牌逻辑
  },

  onHu: function() {
    // 实现胡牌逻辑
  },

  onPass: function() {
    this.setData({
      canPeng: false,
      canGang: false,
      canHu: false,
      canPass: false
    });
    this.aiAction();
  },

  // 更新游戏状态
  updateGameState: function(phase, action = '') {
    const gameState = this.data.gameState;
    gameState.phase = phase;
    gameState.lastAction = action;
    gameState.isThinking = false;

    if (phase === 'playing') {
      gameState.turnTimeLeft = 10;
      this.startTurnTimer();
    }

    this.setData({ gameState });
  },

  // 开始回合计时器
  startTurnTimer: function() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
    }

    this.turnTimer = setInterval(() => {
      const gameState = this.data.gameState;
      if (gameState.turnTimeLeft > 0) {
        gameState.turnTimeLeft--;
        this.setData({ gameState });
      } else {
        clearInterval(this.turnTimer);
        // 时间到，自动过牌
        if (this.data.currentPlayer === 0) {
          this.onPass();
        }
      }
    }, 1000);
  },
});
