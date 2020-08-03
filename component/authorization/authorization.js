// pages/authorization/authorization.js
var app = getApp();
const ResultUser = require("../../api/getUserInfo.js"); // 获取用户信息
var animation = wx.createAnimation({
  duration: 200,
  timingFunction: 'ease',
})
Page({
  /**
   * 页面的初始数据
   */
  data: {
    setUi:{},
    UserOpenId: '',// 当前用户唯一openid
    toast: '',// 注册Toast组件
    userData: {}, //已登录的用户信息
    textlocalction: '', //用户的位置信息 坐标
    localctionaddress: '', //信息
    IsOk: false,// 当前微信是否可以使用本小程序
  },
  // 显示
  showAuthorization(){
    animation.opacity(1).step();
    this.setData({setUi: animation.export()})
  },
  // 关闭
  closeAuthorization(){
    animation.opacity(0).step();
    this.setData({setUi: animation.export()})
    this.triggerEvent('HideAuthorization', {show: false})
  },

  // 用户点击了授权登录按钮
  tapLogin(){
    this.getThisVchatNo(); // 取云基础版本号
    this.toUrl();
  },
  // 显示正在登录
  showLoginToast(){
    wx.showLoading({ title: '正在登录' })
  },
  toUrl(){
      var This = this;
      if(this.data.IsOk != false){
        this.GetUserInfo().then(res => { // 授权操作
        This.ThisUserlogin(res, res.stopTestcar);
      })
    }else{
      wx.showModal({
        title: "",
        content: '当前微信版本过低，请升级微信版本再来使用',
        confirmText: '知道了',
        showCancel: false
      })
    }
  },
  async GetUserInfo(toast){
    var wxUserInfo = await ResultUser.getuserinfo(toast);// 获取用户登录信息
    if (wxUserInfo != 0){
      console.log("获取用户信息", wxUserInfo);
      var cloudUserAllData = await ResultUser.getAllUserInfo();// 从云端获取所有用户
      console.log("获取云端信息", cloudUserAllData);
      var ThisUserOpenId = await ResultUser.getThisUserOpenId(); // 获取当前用户openid
      console.log("获取当前用户的openid", ThisUserOpenId);
      var LonginUserAllData = await ResultUser.checkUserInfo(ThisUserOpenId, cloudUserAllData);// 返回登录成功的所有信息数据
      console.log("用户信息:", LonginUserAllData);
      return LonginUserAllData;
    }else{
      return 0;
    }
  },
  // 1.首先判断用户是否授权 再读取微信本地存储的 openid 和 数据库id 是否存在
  // 2.如果存在就直接接跳到个人中心页
  onLoad: function(){
    // this.getThisVchatNo(); // 取云基础版本号
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // var This = this;
    // this.toast = this.selectComponent("#toast");// 加载自定义Toast组件
    // if(this.data.IsOk != false){ // 版本判断
    //   this.YserLoginCheck().then(res => {
    //     if (res !== "erro") {
    //       This.ThisUserlogin(res, res.stopTestcar)
    //     }
    //   })
    // }else{
    //   this.setData({ btn: true }) // 设置钮不能点击
    //   wx.showModal({
    //     title: "",
    //     content: '当前微信版本过低，请升级微信版本再来使用',
    //     confirmText: '知道了',
    //     showCancel: false
    //   })
    // }
  },
  // 确定登录然后跳到个人中心 同步操作
  async YserLoginCheck() {
    var UseInfo = await ResultUser.getLocationData(); // 判断是否已经授权过了 返回云端的用户数据
    return UseInfo;
  },
  // 判断当前微信是否可以使用本小程序
  getThisVchatNo(){
    var This = this;
    wx.getSystemInfo({
      success: res=>{
        let version = res.SDKVersion;
        version = version.replace(/\./g, ""); //去除小数点
        console.log("wx:",version)
        if(version >= 241){
          This.setData({ IsOk: true })
        }
      }
    })
  },
  // 判断当前用户是否可以登录 - 1.判断是否授权  2.判断该用户是否被教练禁止练车
  ThisUserlogin(res, stopTestcar){
      if(res != 0){
        if(stopTestcar != 1){ // 0可以登录 1被禁止登录 this.triggerEvent('HideAuthorization', {show: false})
            this.triggerEvent("responesUserInfo",{userInfo: res})
            this.closeAuthorization();
            wx.hideLoading();
        }else{
          wx.showModal({
            title: "提示",
            content: '您已经被禁止练车，请联系教练解禁后使用！',
            confirmText: '联系教练',
            cancelText: '算了',
            showCancel: false,
            success: res=>{
              if(res.confirm){
                OpenPhoneNo.setOpenPhoneNumber("18510770914");
              }
            }
          })
        }
      }else{
        wx.hideLoading();
      }
  }
})