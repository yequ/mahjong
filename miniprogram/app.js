// app.js
App({
  globalData: {
    // 游戏全局配置
    gameConfig: {
      defaultRounds: 16,      // 默认局数
      defaultBaseScore: 1,    // 默认底分
      defaultDealer: 0,       // 默认庄家位置（0-3）
      enableAutoPlay: false,  // 是否启用自动打牌
      enableSound: true,      // 是否启用音效
    },
    
    // 玩家数据
    players: [
      { id: 0, name: '玩家', type: 'human' },
      { id: 1, name: 'AI-1', type: 'ai' },
      { id: 2, name: 'AI-2', type: 'ai' },
      { id: 3, name: 'AI-3', type: 'ai' }
    ],
    
    // 游戏统计数据
    statistics: {
      totalGames: 0,          // 总对局数
      wins: 0,                // 获胜次数
      highestScore: 0,        // 最高得分
      totalScore: 0,          // 总得分
      fanStatistics: {},      // 番种统计
      winningPatterns: {},    // 胡牌方式统计
    },
    
    // 游戏状态
    gameState: {
      isPlaying: false,       // 是否在游戏中
      currentRound: 0,        // 当前局数
      totalRounds: 0,         // 总局数
      baseScore: 0,           // 当前底分
      dealer: 0,              // 当前庄家
      scores: [0, 0, 0, 0],   // 各玩家得分
      wind: '东',             // 当前圈风
      roundWind: '东',        // 当前局风
    },
    
    // 音效资源
    sounds: {
      peng: '/assets/sounds/peng.mp3',
      gang: '/assets/sounds/gang.mp3',
      hu: '/assets/sounds/hu.mp3',
      tile: '/assets/sounds/tile.mp3',
      win: '/assets/sounds/win.mp3',
      lose: '/assets/sounds/lose.mp3'
    }
  },

  onLaunch: function() {
    // 初始化游戏数据
    this.initGameData();
    
    // 从本地存储加载游戏统计数据
    this.loadStatistics();
  },

  // 初始化游戏数据
  initGameData: function() {
    const gameState = this.globalData.gameState;
    gameState.isPlaying = false;
    gameState.currentRound = 0;
    gameState.totalRounds = this.globalData.gameConfig.defaultRounds;
    gameState.baseScore = this.globalData.gameConfig.defaultBaseScore;
    gameState.dealer = this.globalData.gameConfig.defaultDealer;
    gameState.scores = [0, 0, 0, 0];
    gameState.wind = '东';
    gameState.roundWind = '东';
  },

  // 加载游戏统计数据
  loadStatistics: function() {
    const stats = wx.getStorageSync('mahjong_statistics');
    if (stats) {
      this.globalData.statistics = stats;
    }
  },

  // 保存游戏统计数据
  saveStatistics: function() {
    wx.setStorageSync('mahjong_statistics', this.globalData.statistics);
  },

  // 更新游戏统计
  updateStatistics: function(gameResult) {
    const stats = this.globalData.statistics;
    stats.totalGames++;
    
    if (gameResult.winner === 0) { // 玩家获胜
      stats.wins++;
      if (gameResult.score > stats.highestScore) {
        stats.highestScore = gameResult.score;
      }
    }
    
    stats.totalScore += gameResult.score;
    
    // 更新番种统计
    gameResult.fans.forEach(fan => {
      stats.fanStatistics[fan] = (stats.fanStatistics[fan] || 0) + 1;
    });
    
    // 更新胡牌方式统计
    const pattern = gameResult.pattern; // 例如：'自摸', '放炮'
    stats.winningPatterns[pattern] = (stats.winningPatterns[pattern] || 0) + 1;
    
    // 保存统计数据
    this.saveStatistics();
  },

  // 获取当前风位
  getWindPosition: function(position) {
    const winds = ['东', '南', '西', '北'];
    return winds[position];
  },

  // 更新圈风和局风
  updateWind: function() {
    const gameState = this.globalData.gameState;
    const winds = ['东', '南', '西', '北'];
    
    // 每完成一圈（4局）更新圈风
    if (gameState.currentRound % 16 === 0) {
      const windIndex = winds.indexOf(gameState.wind);
      gameState.wind = winds[(windIndex + 1) % 4];
    }
    
    // 每局更新局风
    const roundInCircle = Math.floor(gameState.currentRound % 4);
    gameState.roundWind = winds[roundInCircle];
  },

  // 播放音效
  playSound: function(soundType) {
    if (!this.globalData.gameConfig.enableSound) return;
    
    const soundPath = this.globalData.sounds[soundType];
    if (soundPath) {
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = soundPath;
      audioContext.play();
    }
  }
});
