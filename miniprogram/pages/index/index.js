Page({
  data: {
    roundOptions: ['4局', '8局', '16局'],
    roundIndex: 0,
    baseScoreOptions: ['1分', '2分', '5分', '10分'],
    baseScoreIndex: 0,
    dealerOptions: ['随机', '玩家', '东家'],
    dealerIndex: 0
  },

  onLoad: function() {
    // 加载上次的游戏设置
    const settings = wx.getStorageSync('gameSettings');
    if (settings) {
      this.setData({
        roundIndex: settings.roundIndex || 0,
        baseScoreIndex: settings.baseScoreIndex || 0,
        dealerIndex: settings.dealerIndex || 0
      });
    }
  },

  onRoundChange: function(e) {
    this.setData({
      roundIndex: e.detail.value
    });
  },

  onBaseScoreChange: function(e) {
    this.setData({
      baseScoreIndex: e.detail.value
    });
  },

  onDealerChange: function(e) {
    this.setData({
      dealerIndex: e.detail.value
    });
  },

  startGame: function() {
    // 保存设置
    const settings = {
      roundIndex: this.data.roundIndex,
      baseScoreIndex: this.data.baseScoreIndex,
      dealerIndex: this.data.dealerIndex,
      totalRounds: parseInt(this.data.roundOptions[this.data.roundIndex]),
      baseScore: parseInt(this.data.baseScoreOptions[this.data.baseScoreIndex]),
      dealer: this.data.dealerOptions[this.data.dealerIndex]
    };
    wx.setStorageSync('gameSettings', settings);

    // 跳转到游戏页面
    wx.navigateTo({
      url: '/pages/game/game'
    });
  },

  showRules: function() {
    wx.showModal({
      title: '游戏规则',
      content: '1. 基本规则：\n' +
               '- 由4名玩家进行，每人13张牌\n' +
               '- 轮流摸牌出牌，可以碰牌、杠牌\n' +
               '2. 胡牌方式：\n' +
               '- 平胡：8分\n' +
               '- 七对子：24分\n' +
               '- 清一色：32分\n' +
               '- 清一色七对：64分\n' +
               '- 十三幺：88分\n' +
               '3. 额外分数：\n' +
               '- 杠上开花：40分\n' +
               '- 抢杠胡：40分\n' +
               '- 自摸：8分\n' +
               '- 明杠：12分\n' +
               '- 暗杠：16分',
      showCancel: false
    });
  }
});
