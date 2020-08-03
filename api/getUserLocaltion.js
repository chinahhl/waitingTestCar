const QQMapWX = require("../util/qqmap-wx-jssdk.js")// 引入定位api

// 初始化定位插件
let qqmapsdk = new QQMapWX({
  key: 'V56BZ-KXMCS-CHQO7-6N7GC-YFAN6-NEBV7'
});

// // 获取用户的坐标位置 成功返回坐标信息 失败返回空
const getUserLocaltionInfo=()=>{
  return new Promise((result,err)=>{
    wx.getLocation({
      success: res=>{
        result(res.latitude + "," + res.longitude);
      },
      fail: erro=>{
        console.log("位置坐标获取失败",erro)
        result("")
      }
    })
  })
}

// 获取用户的位置信息 参数1.传入坐标
const setUserLocaltionNumber = (latitude, longitude)=>{
  var coordinate = latitude + "," + longitude
  return new Promise((result,err)=>{
    console.log(coordinate)// 输出获取到的坐标
    qqmapsdk.reverseGeocoder({
      localtion: coordinate,
      success: res => {
        result(res.result.formatted_addresses)
      },
      fail: erro => {
        console.log("转换失败", erro)
        err(erro)
      }
    })
  })
}

// 获取教练设置的位置
const getCoachSetLocal=()=>{
  return new Promise((result,err)=>{
      wx.cloud.callFunction({
        name: 'setLocaltionInfo',
        data: { type: 3 } // 3是查询 0 是增加 1是修改
      }).then(res => {
        if (res.result.getResult.data.length != 0) {
          result(res.result.getResult.data[0])
        }
      })
  })
}
// 设置教练指定练车地点 0添加 1修改 
const setCoachTestCarLocalction=(latitude, longitude, type, tb_id)=>{
  return new Promise((result,err)=>{
    wx.cloud.callFunction({
      name: 'setLocaltionInfo',
      data: { type: type ,latitude: latitude, longitude: longitude ,tb_id: tb_id }
    }).then(res => {
      result(res);
    })
  })
}
module.exports = {
  // 获取用户位置信息
  getUserLocaltionInfo,
  getCoachSetLocal,// 获取用户设置的位置
  setCoachTestCarLocalction // 把教练排队设置的位置数据上传云端
}