// pages/login/login/agreeRequest/agreeRequest.js
// const db = app.db_request; //选择申请表
const db = wx.cloud.database().collection("StudentApplication");// 选择 StudentApplication 表
Page({
  /**
   * 页面的初始数据
   */
  data: {
    sex: 2,
    requestData: {},
    tb_id:'', // 表id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({ title: '数据加载中...' })
    this.onLoadUserRequestData();
  },
  // 用户同意
  UserOk(e){
    let Tb_id = e.currentTarget.dataset.tb_id;
    let btn = e.currentTarget.dataset.btn;
    wx.showLoading({ title: '正在同意...' })
    if (Tb_id != "" && Tb_id != undefined){
      console.log("ok")
      wx.cloud.callFunction({
        name: 'delUserRequest',
        data: { tb_id: Tb_id, btn: btn}
      }).then(res=>{
        console.log(res)
        if (res.errMsg =="cloud.callFunction:ok"){
          wx.hideLoading();
          wx.showToast({ title: '已同意' })
        }
      })
    }
  },
  // 用户拒绝
  UserNo(e){
    console.log("no")
    let Tb_id = e.currentTarget.dataset.tb_id;
    let btn = e.currentTarget.dataset.btn;
    wx.showLoading({ title: '拒绝中...' })
    if (Tb_id != "" && Tb_id != undefined) {
      console.log("ok")
      wx.cloud.callFunction({
        name: 'delUserRequest',
        data: { tb_id: Tb_id, btn: btn }
      }).then(res => {
        console.log(res)
        if (res.errMsg == "cloud.callFunction:ok") {
          wx.hideLoading();
          wx.showToast({ title: '已拒绝' })
        }
      })
    }
  },
  // 加载申请成为学员的信息
  onLoadUserRequestData(){
    db.watch({
      onChange: res => {
        console.log("监听的数据发生了变化", res)
        this.setData({ requestData: res.docs })
        console.log(this.data.requestData)
        wx.hideLoading();
      },
      onError: err => {
        console.log("监听的数据发生了错误", err)
      }
    })
  }
})