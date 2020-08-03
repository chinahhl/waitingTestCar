// pages/userInfo/userInfo.js
var animation = wx.createAnimation({
  duration: 200,
  timingFunction: 'ease',
})
Page({
  /**
   * 页面的初始数据
   */
  data: {
    show: true,
    setUi: {},
    userdata: {} //用户存放用户数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  // 特效框弹出
  userInfoShow(UserInfo){
    console.log("我被调用了", UserInfo)
    this.setData({ userdata: UserInfo })
    animation.scale(1).step();
    this.setData({
      setUi: animation.export()
    })
  },
  // 点击关闭按钮的操作
  oncloesUserInfo(){
    animation.scale(0).step();
    this.triggerEvent('UserInfoShow', {show: false})
    this.setData({
      setUi: animation.export()
    })
  }
})