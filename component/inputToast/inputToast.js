
var animation = wx.createAnimation({
  duration: 200,
  timingFunction: 'ease',
})
Component({
  data: {
    setUi: {},
    title: '实名认证', // 标题
    UserInputNameData: "", // 用户输入的名字
    focus: true
  },
  methods: {
    // 获取用户输入的名字
    UserInputName(e) {
      this.setData({UserInputNameData: e.detail.value})
    },
    showInputToast() {
      this.animation = animation
      animation.scale(1).step();
      this.setData({
        setUi: animation.export()
      })
    },
    // // 确认 取消按钮 关闭
    resultInputToast(e) {
      let useronclick = e.currentTarget.dataset.index; // 用户点击的是取消还是确认
      if (useronclick == 1) { // 确认
        this.setData({focus: false})
        this.triggerEvent('ResultInputToast', {
          InputToast: false,
          realName: this.data.UserInputNameData
        })
        this.animation = animation
        this.animation.scale(1).step()
        this.setData({
          setUi: animation.export()
        })
      }
      if (useronclick == 0) { // 取消
        this.setData({focus: false})
        this.animation = animation
        this.animation.scale(0).step()
        this.setData({
          setUi: animation.export()
        })
      }
    }
  }
})