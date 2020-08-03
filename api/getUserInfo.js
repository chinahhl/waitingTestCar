// 请求云端用户数据
/**
 * 1.唯一id
 * 2.微信openid
 * 说明：注册了的直接返回，不没注册的插入再返回用户信息
 */
const db = wx.cloud.database().collection("UserInfo");// 选择 UserInfo 表
const time = require("../util/getTime.js")// 引入日期时间
var ThisUserInfo = {};// 保存一下当前授权的用户信息

const getuserinfo = () => {
  return new Promise((result,err) => {
    // 用户是否已经授权
    wx.getSetting({
      success: res=>{
        // 用户已授权的操作
        if (res.authSetting["scope.userInfo"] == true){
          // 用户登录
          wx.getUserInfo({
            success: res => {
              result(res.userInfo);
              ThisUserInfo = res.userInfo;
            }
          })
        }else{// 用户未授权的操作
          wx.login({
            success: res => {
              // 是否授权用户登录
              wx.getUserInfo({
                success: res => {
                  result(res.userInfo);
                  ThisUserInfo = res.userInfo;
                },
                fail: erro => {
                  console.log("用户拒绝了申请，或者取消了授权！")
                  result(0);
                }
              })
            }
          })
        }
      },
      fail: err=>{
        // 失败方法 回调函数 
        console.log("调用方法失败")
      }
    })
   
  })
}
// 获取云端所有用户的信息 get(url).then(res => { console.log(res) })
const getAllUserInfo=()=>{
 return new Promise((result, err)=>{
    wx.cloud.callFunction({ 
      name: "AlluserInfo",
      data:{type: 0 }
    }).then(res=>{
      result(res.result.allUserInfo.data);
    })
 })
}

// 获取当前用户的openid
const getThisUserOpenId=()=>{
  return new Promise((result,err)=>{
    // 参数1=> cloud 下的文件夹名字 参数2=>成功回调函数 参数3=>失败回调函数
    wx.cloud.callFunction({
    name: 'getUserOpenId',
    success: res=>{
      result(res.result.openid);
    },
    fail: erro=>{
      console.log("openid获取失败:", erro)
      err(erro);
    }
  })
  })
}
// 拿到云端数据库对应的唯一openid,根据当前用户的openid 和云端openid对比
const checkUserInfo = (openid,alluser)=>{
  var IsUserInfo = false; // 该用户是否已注册标记
  return new Promise((result, err)=>{

    if(openid == "" || openid==undefined){
      err("参数1.openid缺少");
      return;
    } else if (alluser == undefined && alluser.length != 0){
      console.log(alluser)
      err("参数2.比对用户缺少");
      return;
    } else if (alluser.length == 0){
      // 注册用户进行的操作
      setUserInfo().then(res=>{result(res)})
      return;
    }else{

      // 这里进行了登录操作
      for (var i = 0; i < alluser.length; i++) {  
        if (openid == alluser[i]._openid) {
          var loginTime = time.getdate();
          setUserLoginTime(alluser[i]._id);// 更新云数据时间
          alluser[i].userLoginTime = loginTime; //更新对象属性值
          IsUserInfo = true; 
          result(alluser[i]); 
          break;
        }
      }
      
      // 注册用户进行的操作
      if(IsUserInfo != true){
        setUserInfo().then(res => {result(res)})
      }
    }
  })
}
// 新用户注册登录进行的操作
const setUserInfo=()=>{
  return new Promise((result,err)=>{
    // 没有注册就进行注册操作 type=0（学员）1(教练) 2(游客)
    // 1. - 学员的头像 => 微信头像（已实现）
    // -学员的昵称 => 微信昵称 （已实现）
    // -用户的名字 => 真实名字（已实现）
    // -用户的性别 => 真实性别（已实现）
    // -用户的手机号码 => this（有待实现）
    // -用户今天是否已练车 => (有待实现）
    // -用户已练车时长 => 100小时(有待实现)
    db.add({
      data: {
        type: 2,
        realName: "",
        userphoneNumber: '',
        userRegisterTime: time.getdate(),
        userLoginTime: time.getdate(),
        usergender: ThisUserInfo.gender,
        username: ThisUserInfo.nickName,
        usericon: ThisUserInfo.avatarUrl,
        _thisDayTestcar: false,
        stopTestcar: 0,
        userTestcarTime: 0,
      }
    }).then(res => {
      // 拿返回的id去拿回信息
      db.doc(res._id).get({
        success: res => {
          result(res.data);
        },
        fail: erro => {
          console.log("获取注册用户信息失败", erro)
        }
      })
    })
  })
}
// 获取微信本地存储的数据 进行登录操作
const getLocationData=()=>{
  return new Promise((result,err)=>{
    wx.getSetting({
      success: res=>{
        // 用户已授权才进行读取
        if (res.authSetting["scope.userInfo"] == true){
          // 获取微信本地存储的数据
          wx.getStorage({
            key: 'ThisUserOpenId_and_cloudBaseUserID',
            success: res => {
              if (res.data.ThisUserCloudBaseId != undefined) {
                // result(res.data)
                setUserLoginTime(res.data.ThisUserCloudBaseId);
                db.doc(res.data.ThisUserCloudBaseId).get({
                  success: res => {
                  result(res.data)
                }
              })
            }
          },
            fail: erro => {
              console.log("获取失败,当前用户没有登录过", erro)
              result("erro")
            }
          })
        }
      }
    })
  })
}
// 修改登录的时间 每次登录都修改
const setUserLoginTime=(dbtb_id)=>{
  return new Promise((result,err)=>{
    db.doc(dbtb_id).update({
      data: {
        userLoginTime: time.getdate()
      },
      success: res=>{
        console.log("用户登录时间修改成功")
        result(res)
      },
      fail: erro=>{
        erro("用户登录时间修改失败")
      }
    })
  })
}

// 将方法抛出
module.exports = {
  // 获取用户信息操作
  getuserinfo,
  // 获取所有用户信息操作
  getAllUserInfo,
  // 获取当前用户的openid
  getThisUserOpenId,
  // 判断用户注册是否已注册 都返回数据
  checkUserInfo,
  // 是否已经授权过了，授权过直接跳转个人中心页
  getLocationData,
  // 修改登录时间
  setUserLoginTime,
}