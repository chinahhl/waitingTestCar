// pages/login/login/carManage/carManage.js

const car_db = wx.cloud.database().collection("Car");// 选择汽车存放表
const lineUpCar = require("../../../../api/LineUpCar.js");// 获取车辆排队

Page({

  /**
   * 页面的初始数据
   */
  data: {
    selectCode: '点击选择',
    code: ['桂R','桂A','桂B','桂C','桂D','桂E','桂F','桂G','桂H','桂J','桂K','桂L','桂N','桂O','桂P'],
    listShow: false,// 默认不显示
    userinputCode: 0, // 默认0
    addOKCar: [],
    CarIndex: undefined,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showModal({ 
      showCancel: false,
      content: '目前只支持添加广西内的车辆',
      confirmText: '知道了',
      confirmColor: '#EE9A00'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.onChangeCarData();// 加载已有车辆
  },
  // 点击了选择列表
  myclick(){
    this.setData({ listShow: !this.data.listShow })
  },
  // 点击了哪个
  _thisClick(e){
    var CarCode = e.target.dataset.name;
    this.setData({ listShow: !this.data.listShow, selectCode: CarCode })
  },
  // 用户输入的车牌号码
  userinputCarCode(e){
    if(this.data.listShow != false){
      this.setData({ listShow: false })
    }
    this.setData({userinputCode: e.detail.value})

  },
  // 长按事件
  longClick(e){
    this.setData({ CarIndex: e.currentTarget.dataset.index })
  },
  // 隐藏
  hide(){
    this.setData({ CarIndex: "undefined" })
  },
  // 返回事件
  onUnload(){
    car_db_watch.close(); //关闭车辆监听
  },
  // 监听车辆的表数据发送变化
  async onChangeCarData(){
      car_db_watch = car_db.watch({
        onChange: res=>{
          console.log(res)
          if(res.type == "init"){
            console.log("一般情况我只在载入页面时执行")
          }
          if(res.docs.length < 1 ){
            if(this.data.addOKCar.length < 1){
              wx.showModal({ 
                showCancel: false,
                content: '当前车库没有车车哦，请添加',
                confirmText: '知道了',
              })
            }
          }
          this.setData({ addOKCar: res.docs })
        },
        onError: erro=>{
          console.log("错误")
        }
      })
  },
  // 删除车辆 方法()
  delCar(e){
      // console.log(e.currentTarget.dataset.tb_id)
    wx.showModal({
      title: '敏感操作',
      content: '您确定要删除车辆吗？',
      success: resp=>{
        if(resp.confirm){
          wx.showLoading({title: '删除中...' })
          lineUpCar.CarManage(1,e.currentTarget.dataset.tb_id,"").then(res=>{
            console.log(res)
            wx.showToast({
              title: '删除成功'
            })
            this.setData({ CarIndex: "undefined" })
          })
        }else{
          this.hide();
        }
      }
    })
  },
  // 添加车辆 方法 
  addTestCar(){
      var CarNumberIs = /^[0-9a-zA-Z]+$/;
      if(this.data.selectCode !="点击选择" && this.data.userinputCode != 0 && CarNumberIs.test(this.data.userinputCode)){
        wx.showModal({
          title:'确认操作',
          content: "您输入的是："+this.data.selectCode+this.data.userinputCode,
          confirmColor: '#3CB371',
          success: res=>{
            if(res.confirm){
              wx.showLoading({title: '添加中...' })
              lineUpCar.CarManage(0,"",this.data.selectCode + this.data.userinputCode).then(res=>{
                wx.showToast({title: '已添加' })
              })
            }
          }
        })
      }else{
        wx.showToast({title: '请检查数据是否有误',icon: "none"})
      }
  },
})