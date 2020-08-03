// component/msg/msg.js
var animation = wx.createAnimation({
  timingFunction: 'ease',
  duration: 200
})
Component({
  data:{
    setUi: {},
    icon: 9
  },
  methods: {
    // 弹出
    showMsg(i){
      animation.opacity(1).step()
      animation.scale(1).step();
      this.setData({ setUi: animation.export(), icon: i})

      setTimeout(res=>{
        animation.opacity(0).step()
        animation.scale(0).step();
        this.setData({ setUi: animation.export(), icon: i })
      },800)
    }
  }
})