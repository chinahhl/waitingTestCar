// pages/login/login.js
var app = getApp();
const db = wx.cloud.database().collection("UserInfo"); // 选择 UserInfo 表
const db_request = wx.cloud.database().collection("StudentApplication"); // 选择 StudentApplication 表

const applyToStudent = require("../../api/ApplyToStudent.js"); // 申请成为学员 
const getUserLocaltion = require("../../api/getUserLocaltion.js") // 引入定位api
const userLogin_register = require("../../api/getUserInfo.js") // 登录/注册

var db_requests = {};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userName: '未登录', // 用户登录的名字
    realName: '', // 真实名字
    type: undefined, // 用户类型 0=>学员 1=>教练 2=>游客
    userLogin_time: '2018-1-1 20:00', // 暂时定为登录的时间吧
    userIcon: '', // 用户的头像
    usergender: '', // 性别
    userLoginSatuts: 0, // 当前登录的状态
    bindClick: false, // 是否弹出授权窗口
    toastShow: false, // 是否显示
    inputToast: '', // 自定义控件
    msg: '', // 自定义数字弹框
    showauthorization: false,
    inputToastShow: false, // 是否显示组件
    ThisUserId: '', // 当前用户缓存在本地的表数据id
    UserInfoShow: false, //个人信息框是否显示
    isokName: true, // 申请学员按钮是否禁用
    isApply: false, // 是否正在申请成为学员
    realtimeData: {}, // 实时监听数据的存放对象
    userRquestNumber: 0, // 申请成为学员数量
    userSetLocalction: "", // 教练设置的坐标
    MsgShow: false,
    thisuserL: ''
  },
  onLoad: function () {
    wx.getStorage({
      key: 'ThisUserOpenId_and_cloudBaseUserID',
      success: res => {
        if(res.errMsg == "getStorage:ok"){
          wx.showLoading({title: '数据加载中',mask: true})
          this.UserLogin_Register(); // 登录操作
        }
      }
    })
  },
  onHide: function () {
    app.globalData.StopMusic = true; // 关闭语音
  },
  // 显示授权窗口
  showA(){
    this.setData({ showauthorization: true })
    this.showAuthorization = this.selectComponent("#authorization");
    this.showAuthorization.showAuthorization();
  },
  // 授权窗口点击关闭的 回调函数
  hideA(e){
    this.setData({ showauthorization: e.detail.show })
  },
  // 获取用户授权后的信息
  async getuserAuthorizationinfo(e){
    app.UserInfo = e.detail.userInfo;
    this.setUIdata(app.UserInfo);
    if (app.UserInfo.type == 1) { 
       this.ThisUserIsTestCar(); 
       this.userLocalction_IsOk();
    }
    if(app.UserInfo.realName != ""){
      this.setData({isokName: false})
      this.publicToast("您好," + app.UserInfo.realName + ",欢迎登录", 2000)
    }else{
      this.publicToast("新学员欢迎你哦，先填写真实名字，才可以进行排队哦~", 5000)
    }
    this.seveLocalctionData(); // 添加本地数据缓存
  }
  ,
  // 页面卸载事件
  onUnload: function () {
    db_requests.colse();
  },
  // 设置真实名字 showInputToast
  setUserName: function () {
    if (this.data.realName == "") {
      this.setData({inputToastShow: true})
      this.inputToast = this.selectComponent("#inputToast");
      this.inputToast.showInputToast()
    } else {
      wx.showToast({
        title: '已实名!'
      })
    }
  },
  // 个人中心下拉刷新
  onPullDownRefresh: function () {
    wx.showLoading({title: '数据加载中',mask: true})
    let This = this;
    wx.getStorage({
      key: 'ThisUserOpenId_and_cloudBaseUserID',
      success: res => {
        console.log("获取到当前缓存的key", res.data)
        // 获取云数据库 用户信息
        db.doc(res.data.ThisUserCloudBaseId).get({
          success: res => {
            wx.stopPullDownRefresh() //停止下拉刷新
            This.setUIdata(res.data);
            wx.hideLoading();
            app.UserInfo = res.data; // 刷新用户信息对象
          }
        })
      },
      fail: erro=>{
        wx.hideLoading({
          success: res=>{this.publicToast("未登录",2000);wx.stopPullDownRefresh()}
        })
      }
    })
  },
  // 退出登录操作
  dellocaltionData: function () {
    try {
      wx.removeStorage({
        key: 'ThisUserOpenId_and_cloudBaseUserID',
        success: res => {
          console.log("删除数据成功");
        }
      })
    } catch {
      console.log("数据清除失败")
    }
  },
  // 已授权 登录
  async UserLogin_Register() {
    var This = this;
    let resp = await userLogin_register.getuserinfo();
    if (resp != 0) {

      let AllUserInfo = await userLogin_register.getAllUserInfo();
      let UserOpenId = await userLogin_register.getThisUserOpenId();
      let onUser = await userLogin_register.checkUserInfo(UserOpenId, AllUserInfo); // 当前登录用户的所有信息
      app.UserInfo = await onUser;

      if (app.UserInfo != "" && app.UserInfo != undefined) {

        this.setUIdata(onUser);
        this.onchangeData(); // 初始化实时数据推送监听
        if (onUser.type == 1) {this.ThisUserIsTestCar();this.userLocalction_IsOk();}
  
        if (onUser.realName != "") {
          this.setData({isokName: false})
          this.publicToast("您好," + onUser.realName + ",欢迎登录", 2000)

          setTimeout(function () {
            This.setData({
              toastShow: false
            })
          }, 2500)
        } else {
          this.publicToast("新学员欢迎你哦，先填写真实名字，才可以进行排队哦~", 5000)
        }
      }

    } else {
      this.publicToast("您已取消登录", 3000)
    }
    wx.hideLoading();
  },
  showLoading(){
    wx.showLoading({title: '登录中'})
  },
  // 存入当前用户的openid 和 表数据id
  seveLocalctionData() {
    wx.setStorage({
      key: 'ThisUserOpenId_and_cloudBaseUserID',
      data: {
        ThisUserCloudBaseId: app.UserInfo._id,
        ThisUserCloedOpenId: app.UserInfo._openid
      },
      success: res => {
        if (res.errMsg == "setStorage:ok") {
          console.log("存入成功！");
        }
      }
    })
  },
  // 渲染个人中心界面层
  setUIdata(userData) {
    if (userData.type == 2) {
      this.setData({
        isokName: true
      })
    }
    this.setData({
      realName: userData.realName,
      userName: userData.username,
      userIcon: userData.usericon,
      type: userData.type,
      userLogin_time: userData.userLoginTime.resultDate + " " + userData.userLoginTime.resultTime,
      userLoginSatuts: 1
    })
  },
  // 接受子组件传来的方法
  getInputToastValue(e) {
    var value = e.detail,
      reg = /\s/, // 是否为空 空true 
      Ischinase = false,
      chinase =  /^[\u4E00-\u9FA5]+$/; //是否全为中文 是为true
      if(chinase.test(value.realName)){
        Ischinase = true;
      }else{
        Ischinase = false;
      }
    // 判断是否是undefined

    if (value.realName != undefined && !reg.test(value.realName) && Ischinase && value.realName.length <= 4) {
      // 获取 inputToast=>子组件传来的值

      this.setData({ inputToastShow: value.InputToast, realName: value.realName })
      this.getLocalctionUserid();
      wx.showLoading({title: '实名中...',})
    } else {
      this.setData({inputToastShow: value.InputToast})
      wx.showToast({
        title: '无效输入',
        image: '../../icon/erro.png',
        duration: 2000
      })
    }
  },
  /**
   * 1.首先获取微信本地缓存数据  取出本地表云数据库对应 id => 唯一
   * 2.上传用户填写的 真实名字 存入云数据中 
   * 3.返回最新用户信息
   */
  // 获取微信本地存储的id
  getLocalctionUserid() {
    var This = this; // 保存程序一级指针
    wx.getStorage({
      key: 'ThisUserOpenId_and_cloudBaseUserID',
      success: function (res) {
        This.setData({ThisUserId: res.data.ThisUserCloudBaseId})
        console.log("获取到微信本地存储的数据:", res)
        This.setUserRealNameCloud(); // 执行上传操作
      },
    })
  },
  // 提交获取用户的真实名字
  setUserRealNameCloud() {
    wx.cloud.callFunction({
      name: 'AlluserInfo',
      data:{ type: 1, ThisUserId: this.data.ThisUserId, realName: this.data.realName }
    }).then(res=>{
      console.log("用户已提交真实名字成功", res)
      wx.hideLoading(); // 关闭实名中动画
      wx.showToast({title: '实名成功'})
      this.setData({isokName: false})
      app.UserInfo.realName = this.data.realName; //更新信息对象
    })
  },
  // 跳转学员管理页面
  ToUser_Manage() {
    wx.showLoading({
      title: '数据加载中...'
    })
    wx.navigateTo({
      url: '../../pages/login/login/coach/coach'
    })
    //wx.switchTab({ url: '../../pages/login/login' })// 跳转至 login 页面
  },
  // 显示用户的个人信息
  ShowUserInfo() {
    if(this.data.userLoginSatuts == 1){
      this.userInfo = this.selectComponent("#userInfo");
      this.setData({UserInfoShow: !this.data.UserInfoShow})
      this.userInfo = this.selectComponent("#userInfo");
      this.userInfo.userInfoShow(app.UserInfo);
    }else{
      wx.showModal({
        title: '未登录',
        content: '该功能需要登录才能查看\r\n 确定登录吗？',
        confirmText: '去登录',
        cancelText: '暂不登录',
        success: res=>{
          if(res.confirm){
            this.showA();
          }
        }
      })
    }
  },
  // 用户信息页面被关闭回调
  ResultUserInfoShow(e) {
    // e.detail.show 
    var This = this;
    setTimeout(function () {
      This.setData({
        UserInfoShow: e.detail.show
      })
    }, 210)

  },
  // 是否已经在申请
  onIsApplyStudent(realtimeData) {
    console.log(realtimeData)
    for (var i = 0; i < realtimeData.length; i++) {
      if (realtimeData[i]._openid == app.UserInfo._openid) {
        this.setData({isApply: true,isokName: true})
        return;
      }
    }
    this.setData({
      isApply: false,
      isokName: false
    })
  },
  // 申请成为学员方法
  onApplyIsStudent(e) {
    var This = this;
    wx.showLoading({
      title: '发起申请中'
    })
    if (app.UserInfo != "" && app.UserInfo != undefined) {
      applyToStudent.applyAstudent(app.UserInfo).then(res => { // 添加到用户申请表
        if (res == "cloud.callFunction:ok") {
          this.setData({
            isApply: true,
            isokName: true
          })
          wx.hideLoading();
          this.setData({
            toastShow: true
          })
          this.toast = this.selectComponent("#toast");
          this.toast.showToast("发送申请成功，请联系教练同意申请", 3000)
          setTimeout(function () {
            This.setData({
              toastShow: false
            })
          }, 2500)
        }
      })
    } else {
      console.log("用户操作环境异常");
    }
  },
  // 监听实时返回数据
  onchangeData() {
    var This = this;
    db_requests = db_request.watch({
      onChange: res => {
        this.setData({
          realtimeData: res
        })
        console.log("监听的数据发生了变化", res)
        if (this.data.realName != "") {
          this.onIsApplyStudent(res.docs); // 是否已经申请
        }
        if (res.type != "init") {
          This.onPullDownRefresh(); //刷新用户状态
        }
        this.onStudentRequest(res.docs); // 审批申请操作
      },
      onError: err => {
        console.log("监听的数据发生了错误", err)
      }
    })
  },
  // 游客成为学员审批申请
  onStudentRequest(realtimeData) {
    this.setData({
      userRquestNumber: realtimeData.length
    })
  },
  // 跳转至申请审批页面
  onAgreeRequest() {
    wx.navigateTo({
      url: '../../pages/login/agreeRequest/agreeRequest',
    })
  },
  // 更新用户今天是否练车
  ThisUserIsTestCar() {
    wx.cloud.callFunction({
      name: 'Update_thisDayTestcar'
    }).then(resp => {
      console.log("resp", resp);
    })
  },
  // 排队位置是否已经设置
  userLocalction_IsOk() {
    if (this.data.type == 1) { // 是教练才能调用
      wx.cloud.callFunction({
        name: 'setLocaltionInfo',
        data: {
          type: 3
        } // 3是查询 0 是增加 1是修改
      }).then(res => {
        if (res.result.getResult.data.length != 0) {
           this.setData({userSetLocalction: res.result.getResult.data[0]})
        }
      })
    }
  },
  // 教练设置签到的位置
  async setLocaltionInfo() {
    var This = this;
    this.checkUserAdmin().then(result => {
      if (result != false) {
        if (This.data.userSetLocalction != "") {
          This.publicSetLocalction(1);
        } else {
          This.publicSetLocalction(0);
        }
      }
    })
  },
  // 用户是否开启定位授权 已开启。检查是否已开启GPS定位
  async checkUserAdmin() {
    var userLocalction = await app.globalData.ResuleUserLocaltionInfo.getUserLocaltionInfo();
    if (userLocalction == "") {
      wx.getSetting({
        success: res => {
          if (!res.authSetting["scope.userLocation"]) { // 未开启
            wx.showModal({
              title: '',
              content: '请允许[排队圈]获取您的定位',
              confirmText: '允许',
              cancelText: '拒绝',
              success: res => {
                if (res.confirm) {
                  wx.openSetting({
                    success: result => {
                      if (result.authSetting['scope.userLocation']) {
                        wx.showToast({
                          title: '位置授权成功'
                        })
                        return true; // 返回成功
                      }
                    }
                  })
                }
              }
            })
          } else { // 已开启
            console.log("当前的授权状态", res.authSetting['scope.userLocation']);
            wx.showToast({
              title: '手机GPS未开启',
              image: '../../icon/erro1.png'
            })
            return false; // 返回失败
          }
        }
      })
    } else {
      return true; // 返回成功
    }
    return false; // 返回失败
  },
  publicSetLocalction(type) { // 0 增加 1修改
    const innerAudioContext = wx.createInnerAudioContext(); // 构建实例
    innerAudioContext.src = "//pages/login/music/waiting.mp3";
    let latitude = "",
      longitude = "",
      storage_latitude = "", // 存储第一次获取到的值
      storage_longitude = "";
    wx.showModal({
      title: '预备(一)',
      content: '请移步到需要签到的位置，然后保持手机不要过度移动。之后点击[确定]按钮',
      confirmText: '确定',
      success: re => {
        if (re.confirm) {
          wx.showModal({
            title: '开始定位(二)',
            content: '注意：定位过程手机不要移动，准备好后，点击[开始定位]按钮',
            confirmText: '开始定位',
            success: res => {
              if (res.confirm) {
                innerAudioContext.play();
                let i = 9;
                this.setData({
                  MsgShow: true
                })
                this.msg = this.selectComponent("#msg");
                this.msg.showMsg(i);
                wx.startLocationUpdate({
                  success: res => {
                    wx.onLocationChange(function (res) {
                      latitude = res.latitude.toString().substring(0, 7); // 动态获取的latitude值 
                      longitude = res.longitude.toString().substring(0, 7); // 动态获取的longitude值

                      if (i == 9) {
                        storage_latitude = latitude; // 存储
                        storage_longitude = longitude;
                      }

                    })
                  },
                  fail: erro => {
                    console.log("实时位置获取失败", erro)
                  }
                })
                var timeS = setInterval(res => {
                  i = i - 1;
                  if (i == 0) {
                    this.setData({
                      MsgShow: false
                    })
                    if (type == 0) { // 增加位置操作
                      getUserLocaltion.setCoachTestCarLocalction(storage_latitude, storage_longitude, 0).then(result => {
                        console.log("增加位置操作", result)
                        this.setData({
                          userSetLocalction: "位置设置成功!"
                        })
                        this.publicToast("位置设置成功！", 3000) // 提示
                        innerAudioContext.destroy(); // 销毁当前播放实例
                      })
                    } else { // 修改位置操作
                      getUserLocaltion.setCoachTestCarLocalction(storage_latitude, storage_longitude, 1, this.data.userSetLocalction._id).then(result => {
                        console.log("修改位置操作", result)
                        this.setData({
                          userSetLocalction: "位置修改成功！"
                        })
                        this.publicToast("位置修改成功！", 3000) // 提示
                        innerAudioContext.destroy(); // 销毁当前播放实例
                      })
                    }
                    wx.stopLocationUpdate(); // 关闭实时位置监听
                    clearInterval(timeS);
                  }
                  if (i != 0) {
                    innerAudioContext.play();
                    if (latitude != storage_latitude || longitude != storage_longitude) {
                      this.publicToast("定位过程中检测到手机有移动，请重新设置定位！", 3000) // 提示
                      clearInterval(timeS);
                      innerAudioContext.destroy(); // 销毁当前播放实例
                    }
                  }
                  this.msg.showMsg(i);
                }, 1800)
              }
            }
          })
        }
      }
    })
  },
  // 跳转车辆管理
  CarManage() {
    wx.navigateTo({
      url: '../../pages/login/login/carManage/carManage'
    })
  },
  // 公共的toast
  publicToast(text, colestime) {
    var This = this;
    this.setData({
      toastShow: true
    })
    this.toast = this.selectComponent("#toast");
    this.toast.showToast(text, colestime)
    setTimeout(function () {
      This.setData({
        toastShow: false
      })
    }, colestime)
  }
})