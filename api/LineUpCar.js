// const car_db = wx.cloud.database().collection("Car");// 选择汽车存放表
const TrainingCar = wx.cloud.database().collection("TrainingCar");// 正在练车表

// 是否已排队
function isokLineUp(allLineUpInfo, carInfo, openid){
   if(allLineUpInfo != undefined && openid != undefined){
      console.log("接收到的数据值是：",allLineUpInfo)
      for(var i in allLineUpInfo){
        if(allLineUpInfo[i]._openid == openid){
          for(var j in carInfo){
            if(allLineUpInfo[i].carName == carInfo[j].carName){
              var resultCarInfo = { CarName: carInfo[j].carName, Car_Tb_Id: carInfo[j]._id, select_List_id: j, ThisUserOpenId: allLineUpInfo[i]._openid}
              return resultCarInfo;
              break;
            }
          }
        }
      }
    }
    return null; // 没有在排队返回空
}

// 开始排队 传过来的是用户信息 
stratLineUp=(userInfo)=>{
  return new Promise((result,err)=>{
    wx.cloud.callFunction({
      name: 'stratLineUp',
      data: { userObj: userInfo, type: 3 }
    }).then(res=>{
      result(res)
    })
  })
  result("");
}
// // 点击稍等一下执行的互换方法 实现：点击稍等按钮 跟他的下一位用户互换数组
function ExchangeLineUp(List, Openid){ // 1失败
    console.log("List",List,"Openid:",Openid)
      for(var i=0; i<List.length; i++){
        for(var j=0; j<List[i].list.length; j++){
          console.log(List[i].list[j]);
          if(List[i].list[j]._openid == Openid){
            ExchangeUserInfo = List[i].list[j];
            if(List[i].list[j+1] != undefined){
              var OneUser = List[i].list[j],
                  TwoUser = List[i].list[j+1];
              
              let Exchange = {
                OneUser: OneUser,
                TwoUser: TwoUser,
                type: 0
              };
              return Exchange;// 成功
              break;
              }
            }
            break;
        }
      }
    var result = {
      type: 1 
    }
    return result;// 失败
}

// 取消排队 删除当前用户在排队表里 user_tb_id
delLineUpUser = (user_openid)=>{
  return new Promise((result, err)=>{
      // 删除正在排队的我的信息 
      wx.cloud.callFunction({
        name: 'stratLineUp',
        data: { user_openid: user_openid, type: 4 }
      }).then(res=>{
        result(res);
      })
  })
}
 // 修改车辆人数
setCarNumberSum=(car_tb_id, type)=>{
  return new Promise((result, err)=>{
    if(type==0){
      wx.cloud.callFunction({
        name: 'stratLineUp',
        data: { car_tb_id: car_tb_id, type: 2 ,types: type } // type 2=>修改车辆排队人数 
      }).then(res=>{
        result(res);
      })
    }
    if(type==1){
      wx.cloud.callFunction({
        name: 'stratLineUp',
        data: { car_tb_id: car_tb_id, type: 2 ,types: type } // type 2=>修改车辆排队人数
      }).then(res=>{
        result(res);
      })
    }
  })
}

// 用户练车(上车/下车)公共方法 0上车 1下车
userNowTestCar=(ThisUserInfo, car_tb_id, CarName, InUserTestCar_Tb, types)=>{
  return new Promise((result, err)=>{
      if(types == 0){ 
        // 需要提交的用户信息
        var InTestCarInfo = {
          car_tb_id: car_tb_id,
          CarName: CarName,
          OpenId: ThisUserInfo._openid,
          UserIcon: ThisUserInfo.usericon,
          RealName: ThisUserInfo.realName,
          User_tb_id: ThisUserInfo._id,
          Usergender: ThisUserInfo.usergender
        }
        wx.cloud.callFunction({
          name: 'stratLineUp',
          data: { InTestCarInfo: InTestCarInfo, type: 5}
        }).then(res=>{
          wx.cloud.callFunction({
            name: 'Update_thisDayTestcar',
            data:{ type: 1, user_tb_id: ThisUserInfo._id, _thisDayTestcar: ThisUserInfo._thisDayTestcar}
          })
          result(res);
        })
      }
      if(types == 1){
        wx.cloud.callFunction({
          name: 'stratLineUp',
          data: { car_tb_id: car_tb_id, InUserTestCar_Tb: InUserTestCar_Tb ,type: 6}
        }).then(res=>{
          result(res);
        })
      }
  })
}

// 判断当前用户选择的车辆是否有人使用 有0 没有1 参数1 车辆的Tb唯一 ，判断正在练车队列里是否有 车辆的Tb唯一 
ThisUserSelectCarIsOK=(CarTb)=>{
  return new Promise((result,err)=>{
    TrainingCar.get({ 
      success: res=>{
        if(res.length != 0){
          for(var i in res.data){
            if(res.data[i].car_tb_id == CarTb){
              result(0); // 有
              break
            }
          }
          result(1); // 没有
        }
      }
    })
  })
}
// 0 车辆添加 1删除 LineUpNumber 
CarManage=(type,car_tb_id,carName,)=>{
  return new Promise((result,err)=>{
    if(type==0){ // 添加
      wx.cloud.callFunction({
        name: 'stratLineUp',
        data: { carName: carName, type: 0, lineUpNumber: 0 }
      }).then(res=>{
        result(res);
      })
    }
    if(type==1){// 删除
      wx.cloud.callFunction({
        name: 'stratLineUp',
        data: { type: 1, car_tb_id: car_tb_id }
      }).then(res=>{
        result(res);
      })
    }
  })
}
// 把方法抛出
module.exports = {
  isokLineUp, //是否已排队
  stratLineUp, // 开始排队
  setCarNumberSum, // 修改车辆排队总数
  delLineUpUser, // 取消排队
  userNowTestCar, // 用户上车
  CarManage,// 添加 删除车辆
  ThisUserSelectCarIsOK, //判断当前用户选择的车辆是否有人使用
  ExchangeLineUp, // 互换位置
}