// pages/login/login/coach/coach.js
var app = getApp();
const getAllUserInfo = require("../../../../api/getUserInfo.js"); // 导入获得用户信息模块
const StudentManagement = require("../../../../api/StudentManagement.js"); // 引入学员管理中心模块 
const TrainingCar = wx.cloud.database().collection("TrainingCar"); // 正在练车表
Page({
  /**
   * 页面的初始数据
   */
  data: {
    realName: '李嘉诚',
    UserList_data_index: '', // 识别是否展开
    allUserInfo: [], // 所有用户的信息
    wxname: [], // 处理过的用户昵称
    showToast: false, //默认不加载
    secarchName: '', // 用户需要搜索的名字
    TestCarstatus: false, // 初始化受否暂停状态
    delusertb_id: '', // 被删除人的云表id
    NewTestCarUser: [],
  },
  searchName(e) {
    this.setData({
      secarchName: e.detail.value
    })
    if (e.detail.cursor == 0) { // 输入框为 0 时加载所有用户
      // 加载所有用户
      this.coachgetAllUserInfo().then(res => {
        this.setData({ allUserInfo: res })
        let resp = JSON.parse(JSON.stringify(res));
        
        var list = this.data.NewTestCarUser,
        Userlist = [];
        this.setNickName(res)
        for(var i=0; i<resp.length; i++){
          for(var x=0; x<list.length; x++){
            if(list[x].OpenId == resp[i]._openid){
              resp[i].NewTestCar = true;
              resp[i].TestCarName = list[x].CarName;
              Userlist.push(resp[i]);
            }else{
              resp[i].NewTestCar = false;
              Userlist.push(resp[i]);
            }
          }
        }
        this.setData({allUserInfo: Userlist})
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  // 1.所有的用户数据 
  // 2.开始判断昵称超过5个字后面就显示 ...
  // 3.返回已修改过的昵称的所有用户数据
  setNickName(alluser) {
    let username;
    if (this.data.wxname.length != 0) {
      this.setData({
        wxname: []
      })
    }
    for (var i = 0; i < alluser.length; i++) {
      if (alluser[i].username.length > 5) {
        username = alluser[i].username.substring(0, 5) + "..."
        this.setData({
          wxname: this.data.wxname.concat(username)
        })
      } else {
        this.setData({
          wxname: this.data.wxname.concat(alluser[i].username)
        })
      }
    }
  },
  onLoad: function (options) {
    wx.hideLoading(); // 关闭载入特效
    // 获取用户所有信息 并显示
    this.coachgetAllUserInfo().then(res => {
      this.setData({
        allUserInfo: res
      })
      this.onChangeStudentTestCar();
      this.setNickName(res);
    })
  },
  // 点击列表里的某一行
  UserOnclick(e) {
    var ThisList = e.currentTarget.dataset.index;
    console.log(ThisList)
    if (ThisList === this.data.UserList_data_index) {
      this.setData({
        UserList_data_index: ''
      })
    } else {
      this.setData({
        UserList_data_index: ThisList
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("到底了")
  },
  // 监听正在练车表
  onChangeStudentTestCar() {
    TrainingCar.watch({
      onChange: res => {
        var Userlist = [];
        var allUser = this.data.allUserInfo;
        debugger;
        if (res.docs.length != 0) {
          let respTestCar = JSON.parse(JSON.stringify(res.docs)); //深度转换
          this.setData({NewTestCarUser: res.docs})
          for (var i in respTestCar) {
            allUser.forEach(function (itm) {
              if (respTestCar[i].OpenId == itm._openid) {
                itm.NewTestCar = true;
                itm.TestCarName = respTestCar[i].CarName;
                Userlist.push(itm);
              } else {
                itm.NewTestCar = false;
                Userlist.push(itm);
              }
            })
          }
          this.setData({
            allUserInfo: Userlist
          })
        } else {
          for (var i in allUser) {
            allUser[i].NewTestCar = false;
            allUser[i].TestCarName = undefined;
            Userlist.push(allUser[i])
          }
          this.setData({ allUserInfo: Userlist })
          console.log(this.data.allUserInfo)
        }
      },
      onError: err => {

      }
    })
  },
  // 学员搜索方法
  onSecarhStudent() {
    var This = this;
    if (this.data.secarchName != '') {
      wx.showLoading({
        title: '搜索中...'
      })
      this.manageStudent().then(res => {
        if (res != 0 && res.type != 1) {
          wx.hideLoading(); // 关闭加载动画
          // 将找到的对象转成数组对象
          var arr = []
          arr.push(res)
          var list = this.data.NewTestCarUser,
              Userlist = [];
              this.setNickName(this.data.allUserInfo)
          var is = false;
          for(var i=0; i<arr.length; i++){
            for(var x=0; x<list.length; x++){
              if(list[x].OpenId == arr[i]._openid){
                arr[x].NewTestCar = true;
                arr[x].TestCarName = list[x].CarName;
                Userlist.push(arr[x]);
                is = true;
                break;
              }
            }
          }
          if(is){
            this.setData({allUserInfo: Userlist})
          }else{
            this.setData({allUserInfo: arr})
          }

          this.publicToast('搜索到 [ ' + (arr.length) + ' ] 条数据'); //提示框
        } else {
          wx.hideLoading(); // 关闭加载动画
          this.publicToast('未搜索到该用户'); //提示框
          this.setData({
            allUserInfo: {}
          })
        }
      })
    } else {
      this.publicToast('请输入需要查找的学员名字'); //提示框
    }
  },
  // 学员搜索方法 同步执行方法体
  async manageStudent() {
    var allUser = await StudentManagement.getallUserInfo(); // 获取所有用户
    var SecarhUserInfo = await StudentManagement.SecarhStudent(allUser, this.data.secarchName); // 返回搜索到的用户
    return SecarhUserInfo;
  },
  // 学员删除方法
  deluser(e) {
    wx.showModal({
      title: '敏感操作',
      content: '确定要删除吗？不可恢复',
      confirmText: '确定删除',
      confirmColor: '#FF0000',
      cancelText: '取消',
      cancelColor: '	#008000',
      success: res => {
        if (res.confirm) { // 确认删除
          this.setData({
            delusertb_id: e.target.dataset.tb_id
          })
          this.onconfirm();
        } else { // 取消

        }
      }
    })
  },
  // 暂停 或 允许 学员练车方法
  async stop_or_UserTestcar(e) {
    let tb_id = e.target.dataset.tb_id; // 表id
    let _thisUserStatus = e.target.dataset.istestcarstatus; // 是否被暂停练车状态
    wx.showLoading({
      title: '操作中...'
    })
    let setup = await StudentManagement.stopAndstartUserTestcar(tb_id, _thisUserStatus); // 操作练车权限部分
    if (setup == "cloud.callFunction:ok") {
      // 加载所有用户
      this.coachgetAllUserInfo().then(res => {
        this.setData({
          allUserInfo: res
        })
        this.setNickName(res);
      })
      wx.showToast({
        title: '操作成功'
      })
    } else {
      console.log("修改失败")
    }
    return setup;
  },
  // onconfirm 删除学员的确认按钮
  onconfirm() {
    wx.showLoading({
      title: '正在删除'
    })
    this.setData({
      modalShow: true
    })
    var This = this;
    wx.cloud.callFunction({
      name: 'delUser',
      data: {
        tb_id: This.data.delusertb_id
      } // 调用云删除函数
    }).then(res => {
      // console.log(res.errMsg)
      // 加载所有用户
      this.coachgetAllUserInfo().then(res => {
        this.setData({
          allUserInfo: res
        })
        this.setNickName(res);
      })
      if (res.errMsg == "cloud.callFunction:ok") {
        wx.hideLoading(); // 关闭正在删除加载框
        this.publicToast("删除成功"); //提示框
      }
    })
  },
  // oncancel 删除学员的取消按钮
  oncancel() {
    this.setData({
      modalShow: true
    })
  },
  // 公共的toast方法 传参数 1.提示的内容
  publicToast(text) {
    var This = this;
    if (text != "") {
      this.setData({
        showToast: true
      })
      this.toast = this.selectComponent("#toast");
      this.toast.showToast(text, 2000);
      setTimeout(function () {
        This.setData({
          showToast: false
        })
      }, 2000)
    }
  },
  // 获取所有学员信息
  async coachgetAllUserInfo() {
    // 调用获取所有用户的公共接口
    let AllUserInfo = await getAllUserInfo.getAllUserInfo();
    return AllUserInfo;
  },
})