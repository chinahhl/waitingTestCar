// pages/index/index.js
var app = getApp(); //引入全局变量

const getTime = require("../../util/getTime.js"); // 导入获取时间工具类
const lineUpCar = require("../../api/LineUpCar.js"); // 获取车辆排队
const car_db = wx.cloud.database().collection("Car"); // 选择汽车存放表

const CheckInallowed_db = wx.cloud.database().collection("CheckInallowed"); // 是否可签到排队
const CoachsetLocaltion = require("../../api/getUserLocaltion"); // 位置类
const TrainingCar = wx.cloud.database().collection("TrainingCar"); // 正在练车表

// 实时监听返回的对象，用于关闭监听
var car_db_watch = {},
  lineUp_db_watch = {},
  TrainingCar_watch = {},
  CoachReminder = {};

let IsMsgTestCar = false, // 是否已提示上车
  SpeedingMsg = false; // 是否已经过提示超速
  ReminderList = {}, //所以在线提醒队列的用户
  inPlayObj = {};// 播音频实例

Page({
  /**
   * 页面的初始数据
   */
  data: {
    ThisUserInfo: null, // 当前用户的所有信息
    time: '', // 现在的时间
    car: {}, // 车辆
    CheckOK: false, // 是否可签到 默认不可签到
    CheckOK_tb: '', // 签到表id
    isOkLineUp: false, // 用户是否在排队状态
    lineUpUserInfo: {}, // 当前排队的所有用户
    is: {},
    IokClassLineUpInfo: [], // 已经分类好的用户数组
    isOkStatus: '不在排队处', // 当前状态 不在排队处 开始排队 取消排队
    isOkBackColor: '#f4f4f4', //当前状态背景颜色 	不在排队处=>（#f4f4f4）开始排队=>(#2E8B57) 取消排队=>(#FFA500)
    isOkColor: '#D3D3D3', // 状态字体颜色 不在排队处=>（#D3D3D3) 开始排队=>(#fff)
    isOkShadowColor: '#A9A9A9', // 状态圆框边颜色
    userSelectIndex: '', //用户选中的时修改样式和背景
    userSelectCarName: '', // 用户选中的是哪辆车
    ThisUserRealName: '', // 当前用户真实名字
    ThisUserLineUp: '', // 当前用户排名
    IsLineUp: false, // 是否可以排队
    selectCar_tb: '', //用户选中的车辆表id
    ThisCarLineUpNumber: 0, // 当前选中车辆 排队总人数
    toastShow: false, //公共toast
    ThisOne: false, // 是否第一次进入
    getLati: 0, // 获取教练设置的Lati
    getLong: 0, // 获取教练设置的Long
    thisUsertTu: '',
    thisUserLog: '',
    UserType: 0, //　用户类型　0学员　1教练　2游客
    Isdwom: false, //是否下拉
    dwomIndex: undefined, //下拉哪个
    InUserTestCar_Tb: '', // 正在练车用户表id
    InUserTestCarS: false, // 正在练车状态
    AllNowTestCarUser: [], // 正在练车的所有用户
    showActionsheet: false, //是否默认显示 底部弹出菜单
    groups: [{
      text: '确认',
      type: 'warn',
      value: 1
    }],
    longSelectSudentName: '', // 教练长按获取的正在练车，某学员的真实名字
    longSelectSudentOpenId: '', // 唯一标识
    reminder_tb_id: '', // 在信息提醒的队列里的id
    testSpeed: 0, // 获取到的速度 (经过了转换km/h)
    Speeding: 0, // 指定超速值
    Remi: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.onChangeUserSignin();
    this.publicOnload();
    
    this.setData({ ThisOne: true})
    wx.onNetworkStatusChange((res) => {
      console.log("网络发生了变化", res)
      if (res.isConnected != false) {
        this.publicOnload();
        if (this.data.CheckOK != false) {
          this.userIsLineUp();
        }
      } else {
        car_db_watch.close();
        lineUp_db_watch.close();
      }
    })
    console.log("加载我被执行了")
  },
  onShow() {
    // 设置屏幕常亮
    wx.setKeepScreenOn({keepScreenOn: true})
    if (this.data.ThisOne != true) {
      console.log("显示我被执行了")
      this.publicOnload();
    }
  },
  /*
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({ThisOne: false})
    console.log("隐藏我被执行了")
  },
  onUnload: function () {
    car_db_watch.close();
    lineUp_db_watch.close();
    TrainingCar_watch.close();
    CoachReminder.close();
  },
  /*
   * 生命周期函数--监听页面卸载
   */
  // 用户选择哪个辆车
  userSelectCar(e) {
    if(app.UserInfo != undefined){
    if (this.data.isOkLineUp != true) {
      var carData = e.currentTarget.dataset;
      if (e.currentTarget.dataset != null) {
        this.setData({
          userSelectIndex: carData.index,
          userSelectCarName: carData.carname,
          selectCar_tb: carData.cartb_id
        })
        app.UserInfo.carName = carData.carname; // 当前用户选中的车辆
      }
    } else {
      this.publicToast("请取消排队后再选择其它车辆", 3000);
    }
  }else{
    wx.showModal({
      title: '未登录',
      content: '该功能需登录才能使用',
      confirmText: '去登录',
      cancelText: '暂不登录',
      success: res=>{
        if(res.confirm){
          wx.switchTab({
            url: '/pages/login/login',
          })
        }
      }
    })
  }
  },
  // 用户点击了排队按钮
  userlineUp() {
    // 开始排队操作 
    if (this.data.IsLineUp == true) {
      if (this.data.userSelectCarName != "") {
        if (this.data.isOkStatus == "开始排队") {
          app.globalData.StopMusic = false; // 开启语音
          wx.showModal({
            title: '提示',
            content: '您选择的是:[ ' + this.data.userSelectCarName + " ],的车辆",
            confirmText: '确认选择',
            confirmColor: '#3e3ee',
            success: res => {
              if (res.confirm) { // 用户点了确认
                if (this.data.CheckOK != false) {
                  this.startLineUpFunction(); // 执行排队操作
                  wx.stopLocationUpdate(); // 关闭实时位置监听
                } else {
                  wx.showModal({
                    title: '车辆选择',
                    content: '教练已关闭排队签到',
                    showCancel: false,
                    confirmText: '知道了'
                  })
                }
              }
            }
          })
        } else if (this.data.isOkStatus == "取消排队") {
          if (this.data.CheckOK != false) {
            this.setData({
              isOkLineUp: false
            })
            this.setPublicLineUpCar(0); // 取消排队操作
            this.getUserThisLocaltion(); //调用定位
          } else {
            wx.showModal({
              title: '排队',
              content: '教练已关闭排队签到',
              showCancel: false,
              confirmText: '知道了'
            })
          }
        } else { // 下车操作
          if (this.data.CheckOK != false) {
            wx.showLoading({
              title: '下车中'
            })
            this.userOnTheTrain(1); // 0上车 1下车
          } else {
            this.publicBtnSetStyle("开始排队", "#2E8B57", "#fff", true); //设置按钮样式
            wx.showModal({
              title: '练车',
              content: '教练已关闭排队签到',
              showCancel: false,
              confirmText: '知道了'
            })
          }
        }
      } else {
        wx.showModal({
          title: '提示',
          content: '您还未选择需要排队的车辆',
          showCancel: false
        })
      }
    }
  },
  // 判断用户是否已经在排队队列 _openid isOkLineUp=>是否已在排队了
  async userIsLineUp(AllUserLineUpInfo) {
    var res = lineUpCar.isokLineUp(AllUserLineUpInfo, this.data.car, app.UserInfo._openid);
    console.log("返回该用户的排队车辆信息", res)
    if (res != null) { // 在排队
      this.setData({
        isOkLineUp: true,
        userSelectIndex: parseInt(res.select_List_id),
        userSelectCarName: res.CarName,
        selectCar_tb: res.Car_Tb_Id
      });
      this.publicBtnSetStyle("取消排队", "#FFA500", "#fff", true); //设置按钮样式
      if (this.data.lineUpUserInfo.length != 0) {
        this.nowNumber(this.data.lineUpUserInfo); // 排名
      }
    }
  },
  // 排队用户是否在正在练车队列
  userIsInTestCar: function (AllNowTestCarUser) {
    for (var i = 0; i < AllNowTestCarUser.length; i++) {
      if (AllNowTestCarUser[i].OpenId == this.data.ThisUserInfo._openid) {
        this.publicBtnSetStyle("下车", "#104E8B", "#f4f4f4", true); //设置按钮样式
        for (var x = 0; x < this.data.car.length; x++) {
          if (AllNowTestCarUser[i].CarName == this.data.car[x].carName) {
            this.setData({
              isOkLineUp: true,
              userSelectIndex: x,
              userSelectCarName: this.data.car[x].carName,
              selectCar_tb: this.data.car[x]._id,
              InUserTestCar_Tb: AllNowTestCarUser[i]._id
            });
          }
        }
        this.setData({
          InUserTestCarS: true
        })
        break;
      }
    }
  },
  // 判断当前位置是否是可排队位置
  IsLocaltion_ok(latitude, longitude) {

    let Latitude = latitude.toString().substring(0, 7), // 动态获取的latitude值 
      Longitude = longitude.toString().substring(0, 7); // 动态获取的longitude值
    this.setData({
      thisUsertTu: Latitude,
      thisUserLo: Longitude
    })
    let Slatitude = Latitude.split("."), // Slatitude[0] = 23.xxx 动态获取的
      Slongitude = Longitude.split("."); // Slongitude[0] = 110.xxx 动态获取的

    let CoachGetLati = this.data.getLati.split("."), // 获取教练设置的
      CoachGetLong = this.data.getLong.split(".");

    let Ssumlatitude = Math.abs(CoachGetLati[1] - Slatitude[1]);
    let Ssumlongitude = Math.abs(CoachGetLong[1] - Slongitude[1]);
    if (this.data.isOkLineUp != true) {
      if (Slatitude[0] == CoachGetLati[0] && Ssumlatitude <= 5 && Slongitude[0] == CoachGetLong[0] && Ssumlongitude <= 5) {
        this.setData({
          isOkStatus: '开始排队',
          isOkBackColor: '#2E8B57',
          isOkColor: '#fff',
          IsLineUp: true
        })
        // this.publicBtnSetStyle("开始排队","#2E8B57","#fff",true)
      } else {
        this.setData({
          isOkStatus: '不在排队处',
          isOkBackColor: '#f4f4f4',
          isOkColor: '#D3D3D3',
          IsLineUp: false
        })
        // this.publicBtnSetStyle("不在排队处","#f4f4f4","#D3D3D3",false)
      }
    }
  },
  // 监听车辆的表数据发送变化
  onChangeCarData() {
    car_db_watch = car_db.watch({
      onChange: res => {
        if (res.type == "init") {
          IsLoadData = false;
          console.log("一般情况我只在载入页面时执行")
        }
        this.setData({car: res.docs})
      },
      onError: erro => {
        console.log("车辆监听错误", erro)
      }
    })
  },
  // 监听排队用户数据变化
  onChangeUserLineUpData() {
    lineUp_db_watch = wx.cloud.database().collection("AllUserLineUp").orderBy('LineUpTime', 'asc')
      .watch({
        onChange: res => {
          if (res.type != "init") {
            lineUp_db_watch.close();
            this.onChangeUserLineUpData();
            return false;
          }
          if (res.docs.length != 0 && res.type == "init") { // 初始化 第一次返回
            this.userIsLineUp(res.docs);
          }
          console.log("返回的数据", res)
          let resp = res.docs
          let tempResp = JSON.parse(JSON.stringify(resp));
          // debugger;
          this.setData({
            lineUpUserInfo: tempResp,
            // IsLineUp: true
          });
          // debugger
          this.getReapeat(resp);

        },
        onError: erro => {
          console.log("监听排队错误", erro)
        }
      })
  },
  // 监听正在练车用户数据变化
  onChangeUserNowTestCarData() {
    TrainingCar_watch = TrainingCar.watch({
      onChange: res => {
        this.setData({
          AllNowTestCarUser: res.docs
        })
        this.userIsInTestCar(res.docs);
        console.log(this.data.AllNowTestCarUser);
        if (res.type != "init" && this.data.UserType != 1) {
          // debugger;
          this.getReapeat(this.data.lineUpUserInfo);
        }
      },
      onError: erro => {
        console.log("监听正在练车错误", erro)
      }
    })
  },
  // 监听教练是否打开排队
  onChangeUserSignin() {
    CheckInallowed_db.watch({
      onChange: res => {
        if (res.docs.length != 0) {
          this.setData({
            CheckOK: res.docs[0].SignIn,
            CheckOK_tb: res.docs[0]._id,
            Speeding: res.docs[0].Speeding
          })

          console.log("监听开始:", this.data.CheckOK)
          app.globalData.Signin = res.docs[0].SignIn;
          if (this.data.CheckOK && this.data.isOkLineUp) {
            this.publicBtnSetStyle("开始排队", "#2E8B57", "#ffffff", true);
            this.setData({
              isOkLineUp: false
            }) // 当前是否在排队状态
          }
          if (res.docs[0].SignIn = true) {
            this.publicOnload();
            IsMsgTestCar = false;
          }
          if (this.data.UserType != 1 && this.data.UserType != 2 && this.data.CheckOK != true && res.type != "init" && this.data.userSelectCarName == "") {
            wx.showModal({
              title: '关闭通知',
              content: '排队签到已关闭！',
              showCancel: false,
              confirmText: '知道了'
            })
            car_db_watch.close();
            lineUp_db_watch.close();
            TrainingCar_watch.close();
            IsLoading = false;
          }
        }
      },
      onError: erro => {
        console.log("数据监听错误");
      }
    })
  },
  // 监听提醒学员下车表
  onChangeCoachReminder() {
    CoachReminder = wx.cloud.database().collection("CoachReminder").watch({
      onChange: res => {
        console.log("提醒", res.docs);
        ReminderList = res.docs;
        
        if (res.docs.length != 0 && this.data.UserType != 1) { // 提醒队列有人
          for (var i = 0; i < res.docs.length; i++) {
            if (res.docs[i].OpenId == this.data.ThisUserInfo._openid) {
              this.setData({reminder_tb_id: res.docs[i]._id})
              this.startReminderTestCarUser(1); // 开始语音提醒 加文字提醒
            }
          }
        }
      },
      onError: erro => {
        console.log("监听提醒学员错误");
      }
    }); // 正在练车表

  },
  // 开始提醒用户 1提醒 0关闭    10秒钟提示一次
  startReminderTestCarUser(type) {
    var This = this;
    if (type == 1) {
        app.publicPlayMusic("//pages/index/audio/Speeding.wav", "教练提醒您下车,下车后点击下车按钮");
        This.publicToast('教练正在提醒您下车',5000);
        This.setData({ Remi: false })
       var reminderTime =  setInterval(function () {
        if(This.data.Remi != false){ 
          clearInterval(reminderTime);
        }else{
          This.publicToast('教练正在提醒您下车',5000);
          app.publicPlayMusic("//pages/index/audio/Speeding.wav", "教练提醒您下车,下车后点击下车按钮");
        }
      }, 20000)
    }
    if(type == 0){
      wx.cloud.callFunction({ // 移除通知
        name: 'stratLineUp',
        data: {
          type: 9,
          reminder_tb_id: this.data.reminder_tb_id
        }
      }).then(res=>{
        This.setData({ Remi: true })
      })
    }
  },
  // 允许/关闭签到排队
  setSignIn: function () {
    if (this.data.CheckOK != true) { // 打开
      wx.showModal({
        title: '开启排队',
        content: '确定要开启排队签到吗？',
        confirmText: '确定',
        cancelText: '取消',
        success: result => {
          if (result.confirm) {
            wx.showLoading({
              title: '打开中'
            });
            wx.cloud.callFunction({
              name: 'Open_and_CloseSignIn',
              data: {
                SignIn_tb: this.data.CheckOK_tb,
                type: 0
              } // 0打开 1关闭
            }).then(res => {
              if (res.errMsg == "cloud.callFunction:ok") {
                wx.showToast({
                  title: '打开签到成功'
                })
              }
            })
          }
        }
      })
    } else { // 关闭
      wx.showModal({
        title: '关闭排队',
        content: '确定要关闭排队签到吗？',
        confirmText: '确定',
        cancelText: '取消',
        success: result => {
          if (result.confirm) {
            wx.showLoading({
              title: '关闭中'
            });
            wx.cloud.callFunction({
              name: 'Open_and_CloseSignIn',
              data: {
                SignIn_tb: this.data.CheckOK_tb,
                type: 1
              } // 0打开 1关闭
            }).then(res => {
              if (res.errMsg == "cloud.callFunction:ok") {
                wx.showToast({
                  title: '关闭签到成功'
                })
              }
            })
          }
        }
      })
    }
  },
  // 开始排队操作
  startLineUpFunction() {
    if (this.data.car.length != 0) {
      this.setPublicLineUpCar(1); // 增加排队
    } else {
      wx.showModal({
        title: '无教练车',
        content: '教练有点懒，还没有添加训练车'
      })
    }
  },
  // 车辆修改等待人数公用方法
  setPublicLineUpCar(type) { // 1增加 0减去
    if (type == 1) {
      // let resultLineUpTime = getTime.getdate();
      wx.showLoading({
        title: '排队中'
      })
      var This = this;
      app.UserInfo.LineUpTime = Date.now(); // 获取当前的排队时间(时间戳) 0生成时间戳 1转换时间戳为时间
      app.UserInfo.carName = this.data.userSelectCarName;
      lineUpCar.stratLineUp(app.UserInfo).then(res => {
        if (res.errMsg == "cloud.callFunction:ok") {
          lineUpCar.setCarNumberSum(this.data.selectCar_tb, 0).then(result => { // 0增加 1减去
            if (result.result.CarResult.stats.updated == 1) {
              This.getUserThisLocaltion();
              wx.hideLoading(); // 关闭排队登录动画
              this.setData({
                isOkLineUp: true
              })
              this.publicBtnSetStyle("取消排队", "#FFA500", "#fff", true); //设置按钮样式
              // wx.offLocationChange()
            }
          })
        }
      })
    } else if (type == 0) {
      wx.showLoading({
        title: '取消中'
      })
      // 取消排队
      lineUpCar.delLineUpUser(app.UserInfo._openid).then(res => {
        console.log("res:", res)
        if (res.errMsg == "cloud.callFunction:ok") {
          lineUpCar.setCarNumberSum(this.data.selectCar_tb, 1).then(result => { // 1减去车辆排队人数
            if (result.result.CarResult.stats.updated == 1) {
              wx.showToast({
                title: '取消排队成功'
              })
              app.globalData.StopMusic = false;
              this.publicBtnSetStyle("开始排队", "#2E8B57", "#ffffff", true)
              this.setData({
                IsLineUp: true,
                isOkLineUp: false
              })
            }
          });
        }
      })
    } else {
      console.log("修改车辆等待人数失败");
    }
  },
  // 调用微信内部定位
  getUserThisLocaltion() {
    var This = this;
    wx.getLocation({ // 用户是否开启定位
      success: res => {
        wx.startLocationUpdate({
          success: resp => {
            wx.onLocationChange(function (res) {
              console.log('位置已发生变化', res)
              if (This.data.getLati != 0) {
                This.IsLocaltion_ok(res.latitude, res.longitude);
                if (This.data.InUserTestCarS) { // 在练车状态才判断当前车速

                  let KM_H = parseInt(res.speed * 3.6); // 换算m/s 成 km/h
                  console.log("现在的速度为：",KM_H);
                  This.setData({testSpeed: KM_H});
                  This.checkUserSpeeding(KM_H); // 传入速度
                }
              }
            })
          }
        })
      },
      fail: erro => {
        console.log("位置坐标获取失败", erro)
        wx.getSetting({
          success: res => {
            if (!res.authSetting['scope.userLocation']) {
              wx.showModal({
                title: '',
                content: '允许[排队圈]获取您的定位,才可以进行排队签到哦',
                confirmText: '允许',
                cancelText: '拒绝',
                success: res => {
                  if (res.confirm) {
                    wx.openSetting({
                      success: result => {
                        if (result.authSetting['scope.userLoca tion']) {
                          wx.showToast({
                            title: '位置授权成功'
                          })
                        }
                      }
                    })
                  }
                }
              })
            } else {
              console.log("当前的授权状态", res.authSetting['scope.userLocation']);
              wx.showToast({
                title: '手机GPS未开启',
                image: '../../icon/erro1.png'
              })
            }
          }
        })

      }
    })

    
    // wx.offLocationChange(_locationChangeFn)
  },
  // 获取教练设置的位置
  getCoachSetLocalction() {
    CoachsetLocaltion.getCoachSetLocal().then(res => {
      this.setData({
        getLati: res.latitude,
        getLong: res.longitude
      })
    });
  },
  // 现在的时间
  nowTime() {
    var This = this;
    setInterval(function () {
      var ThisTime = getTime.getdate(); //获取时间
      This.setData({
        time: ThisTime.resultTime
      })
    }, 1000)
  },
  // 公共的初始化方法
  publicOnload() {
    this.onChangeCarData(); // 监听车辆表数据发送变化 
    if (app.UserInfo != undefined) {
      app.globalData.StopMusic = false;
      this.setData({
        ThisUserInfo: app.UserInfo,
        ThisOne: true,
        UserType: app.UserInfo.type
      })
      if (app.globalData.Signin != false || this.data.UserType == 1) {
        if (app.UserInfo.type != 1) {
          this.getUserThisLocaltion(); //调用定位
          this.nowTime(); // 显示现在的时间
        }
  
        // this.onChangeCarData(); // 监听车辆表数据发送变化 
        this.onChangeUserLineUpData(); // 监听用户排队数据发送变化
        this.getCoachSetLocalction(); // 拿到教练设置的位置
        this.onChangeUserNowTestCarData(); // 监听正在练车表数据变化
        this.onChangeCoachReminder();// 监听是否提示学员
      }
    }else if(this.data.ThisOne != true){
      this.setData({isOkStatus: '未登录'})
    }
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
  },
  // 修改签到按钮的公共样式 isOkStatus=>按钮文字 isOkBackColor=>按钮背景色 isOkColor=>按钮字体颜色 IsLineUp=>是否可以点击排队按钮
  publicBtnSetStyle(isOkStatus, isOkBackColor, isOkColor, IsLineUp) {
    this.setData({
      isOkStatus: isOkStatus,
      isOkBackColor: isOkBackColor,
      isOkColor: isOkColor,
      IsLineUp: IsLineUp
    })
  },
  // 现在的排名位置
  async nowNumber(ThisCarAllLineUp) {
    // debugger;
    for (itm in ThisCarAllLineUp) {
      for (jtm in ThisCarAllLineUp[itm].list) {
        if (ThisCarAllLineUp[itm].list[jtm]._openid == app.UserInfo._openid) {
          if (this.data.CheckOK == true) {
            this.setData({
              ThisUserLineup: ThisCarAllLineUp[itm].list[jtm].rank
            })
            if (ThisCarAllLineUp[itm].list[jtm].rank == 1 && this.data.isOkLineUp) { // 1.不是第一名的不需要查 2.查询是否还在排队队列 
              let res = await lineUpCar.ThisUserSelectCarIsOK(this.data.selectCar_tb); // 是否有人使用该车辆
              if (ThisCarAllLineUp[itm].list[jtm].rank == 1 && res == 1) { // 可以写 上车方法
                if (IsMsgTestCar != true) {
                  inPlayObj = app.publicPlayMusic("//pages/index/audio/LineUpAudio.mp3", "您排队的," + this.data.userSelectCarName + "训练车，已可上车。准备好后，请点击确认上车按钮");
                  this.userOnTheTrain(0); // 上车操作
                  IsMsgTestCar = true; // 已提示过了
                }
              }
            }
          }
        }
      }
    }
  },
  // 轮到用户上车/下车 方法 0上车 1下车
  userOnTheTrain(type) {
    var This = this;
    if (type == 0) {
      wx.showModal({
        title: '练车提醒',
        content: "您选择的[ " + this.data.userSelectCarName + " ]，可以上车了！\r\n准备好后，请点击“确认上车”按钮。\r\n祝您练车愉快！",
        confirmText: '确认上车',
        confirmColor: '#2E8B57',
        cancelText: '稍等一下',
        cancelColor: '#FFA500',
        success: res => {
          if (res.confirm) { // 用户点了确认
            if (this.data.CheckOK != false) { // 判断教练是否关闭练车排队
              This.setTestCarFunction(this.data.ThisUserInfo, this.data.selectCar_tb, this.data.userSelectCarName)
            } else {
              wx.showModal({
                title: '练车',
                content: '教练已关闭排队签到',
                showCancel: false,
                confirmText: '知道了'
              })
            }
            app.globalData.InnerAudioContext.stop();
          } else {

            if (this.data.CheckOK != false) {
              IsMsgTestCar = false;
              app.globalData.InnerAudioContext.stop();
              wx.showLoading({
                title: '位置互换中'
              })
              var result = lineUpCar.ExchangeLineUp(this.data.IokClassLineUpInfo, app.UserInfo._openid);
              if (result.type != 1) {
                console.log("result", result)
                wx.cloud.callFunction({
                  name: 'stratLineUp',
                  data: {
                    OneUser: result.OneUser,
                    TwoUser: result.TwoUser,
                    type: 7
                  }
                }).then(resultData => {
                  if (resultData.errMsg == "cloud.callFunction:ok") {
                    wx.showToast({
                      title: '互换完毕'
                    })
                  } else {
                    wx.showToast({
                      title: '数据出错,互换失败！请重启小程序再试！',
                      icon: "none"
                    })
                  }
                  console.log("resultData:", resultData);
                })
              } else {
                wx.hideLoading(); // 关闭载入效果
                wx.showModal({
                  title: '提示',
                  content: '当前[ ' + this.data.userSelectCarName + ' ]车辆\r\n就您一个人排队，不能互换位置！\r\n可以选择确认上车或者取消排队！',
                  confirmText: '确认上车',
                  confirmColor: '#2E8B57',
                  cancelText: '取消排队',
                  cancelColor: '#FFA500',
                  success: res => {
                    if (res.confirm) { // 点击上车操作
                      if (this.data.CheckOK != false) {
                        This.setTestCarFunction(); // 上车
                      } else {
                        wx.showModal({
                          title: '练车',
                          content: '教练已关闭排队签到',
                          showCancel: false,
                          confirmText: '知道了'
                        })
                      }
                    } else { // 取消排队操作
                      if (this.data.CheckOK != false) {
                        This.setPublicLineUpCar(0); // 取消排队
                        app.globalData.InnerAudioContext.stop();
                        console.log("??",app.globalData.InnerAudioContext);
                      } else {
                        wx.showModal({
                          title: '练车',
                          content: '教练已关闭排队签到',
                          showCancel: false,
                          confirmText: '知道了'
                        })
                      }
                    }
                  }
                })
              }
            } else {
              wx.showModal({
                title: '练车',
                content: '教练已关闭排队签到',
                showCancel: false,
                confirmText: '知道了'
              })
            }
          }
        }
      })
    } else { // 下车操作
      if (this.data.CheckOK != false) {
        lineUpCar.userNowTestCar("", this.data.selectCar_tb, "", this.data.InUserTestCar_Tb, 1).then(re => {
          console.log("下车返回了:", re)
          if (re.errMsg == "cloud.callFunction:ok") {
            wx.hideLoading();
            app.globalData.InnerAudioContext.stop();
            IsMsgTestCar = false; // 提示
            if (this.data.reminder_tb_id != '') { // 是否被教练提醒过
              this.startReminderTestCarUser(0); // 移除提醒队列
            }
            this.publicBtnSetStyle("开始排队", "#2E8B57", "#ffffff", true)
            this.setData({
              isOkLineUp: false,
              InUserTestCarS: false
            })
          }
        })
      } else {
        wx.showModal({
          title: '练车',
          content: '教练已关闭排队签到',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    }
  },
  // 上车具体方法
  setTestCarFunction() {
    var This = this;
    wx.showLoading({title: "上车中"});
    lineUpCar.userNowTestCar(this.data.ThisUserInfo, this.data.selectCar_tb, this.data.userSelectCarName, "", 0).then(result => {
      console.log("上车返回了:", result)
      if (result.errMsg == "cloud.callFunction:ok") {
        This.setData({InUserTestCar_Tb: result.result.TestS._id})
        wx.hideLoading();

        This.publicBtnSetStyle("下车", "#104E8B", "#f4f4f4", true); //设置按钮样式
      }
    })
  },
  // 用户排队类别筛选
  getReapeat(AllUserLineUp) {
    // debugger;
    console.log("lineUpUserInfo:", this.data.lineUpUserInfo);
    var self = this;
    var carInfo = {},
      list = [];

    AllUserLineUp.forEach(function (itm) {
      let carNo = itm.carName;
      var originInfo = carInfo[carNo];
      if (originInfo == undefined) {
        // debugger;
        itm.rank = 1;
        // let pastTimes = times.human(itm.LineUpTime); // 排了多久的时间
        // itm.pastTimes = pastTimes;
        let Times = self.getdate(itm.LineUpTime, "", 1); // 2020-1-1 20:20:21
        TimeSplit = Times.split(" "); // TimeSplit[0]: 2020-1-1 TimeSplit[1]: 20:20:21
        itm.LineUpTime = TimeSplit[1]; //时间
        itm.Date = TimeSplit[0]; // 日期
        originInfo = [itm];
      } else {

        originInfo.push(itm)
        let count = originInfo.length;
        itm.rank = count; 

        // let pastTimes = times.human(itm.LineUpTime); // 排了多久的时间
        // itm.pastTimes = pastTimes;
        let Times = self.getdate(itm.LineUpTime, "", 1); // 2020-1-1 20:20:21
        TimeSplit = Times.split(" "); // TimeSplit[0]: 2020-1-1 TimeSplit[1]: 20:20:21
        itm.LineUpTime = TimeSplit[1]; //时间
        itm.Date = TimeSplit[0]; // 日期
      }
      carInfo[carNo] = originInfo;
    })

    for (var itm in carInfo) {
      let temp = {
        list: carInfo[itm],
        name: itm
      };
      list.push(temp);
    }
    this.setData({
      IokClassLineUpInfo: list
    });
    if (this.data.UserType != 1) {
      this.nowNumber(list);
    }
    console.log("我被执行了几次")
  },
  // 点击下拉事件
  showPull(e) {
    console.log(e.currentTarget.dataset.index)
    this.setData({
      Isdwom: !this.data.Isdwom,
      dwomIndex: e.currentTarget.dataset.index
    })
  },
  // 时间转换时间戳 时间戳转换时间 0时间戳转时间 1时间戳转时间
  getdate: function (longTimes, type, types) {
    if (types == 1) {
      var _data = longTimes;
      //如果是13位正常，如果是10位则需要转化为毫秒
      if (String(longTimes).length == 13) {
        _data = longTimes;
      } else {
        _data = longTimes * 1000;
      }
      const time = new Date(_data);
      const Y = time.getFullYear();
      const Mon = time.getMonth() + 1;
      const Day = time.getDate();
      const H = time.getHours();
      var Min = time.getMinutes();
      var S = time.getSeconds();
      if (Min < 10) {
        Min = "0" + Min;
      }
      if (S < 10) {
        S = "0" + S;
      }

      //选择想要返回的日期类型
      if (type == "y") {
        return `${Y}-${Mon}-${Day}`;
      } else if (type == "h") {
        return `${H}:${Min}:${S}`;
      } else {
        return `${Y}-${Mon}-${Day} ${H}:${Min}:${S}`; // 返回时间
      }
    } else {
      var longTimes = Math.round(new Date() / 1000);
      return longTimes; //返回生成的时间戳
    }
  },
  // 正在练车区域长按事件
  onlongClick(e) { // e.currentTarget.dataset.inrealname 
    var Info = e.currentTarget.dataset;
    console.log("我被长按了", e)
    this.setData({
      longSelectSudentName: Info.inrealname,
      longSelectSudentOpenId: Info.openid,
      showActionsheet: true
    })
  },
  // 判断正在练车的用户是否超速
  checkUserSpeeding: function (Speed) {
    if (Speed > this.data.Speeding && SpeedingMsg != true) { // 证明超速了
      app.publicPlayMusic("//pages/index/audio/Speeding.wav", '您已超速，您当前的速度为，' + Speed + "，请减速慢行！");
      SpeedingMsg = true;
      var msgTime = setInterval(function () {
        SpeedingMsg = false;
        clearInterval(msgTime);
      }, 10000)
    }
  },
  // 关闭底部弹菜单
  close: function () {
    this.setData({
      showActionsheet: false
    })
  },
  // 获取菜单选中的选项
  btnClick(e) {
    let activeBoy = e.detail.value;
    // debugger;
    if (activeBoy == 1) { // 提醒用户下车

      for(var i=0;i<ReminderList.length;i++){
        if(ReminderList[i].OpenId == this.data.longSelectSudentOpenId){
          wx.showToast({title: '您已提醒过该用户！',icon: 'none'})
          this.close()
          return;
          break;
        }
      }
      wx.showLoading({
        title: '提醒中'
      })
      wx.cloud.callFunction({
        name: 'stratLineUp',
        data: {
          OpenId: this.data.longSelectSudentOpenId,
          RealName: this.data.longSelectSudentName,
          type: 8
        }
      }).then(res => {
        console.log("提醒成功", res);
        wx.showToast({
          title: '提醒成功'
        })
      })
    }
    this.close()
  },
  // 当前页面转发
  onShareAppMessage: function () {
    wx.showShareMenu({withShareTicket: true})
    return {
      title: '我在排队，快点哦，就差你了',
      path: '/pages/index/index'
    }
  }
})