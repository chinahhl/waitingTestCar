// 学员管理中心
const ResultUser = require("./getUserInfo.js"); // 获取用户信息
const db = wx.cloud.database().collection("UserInfo");// 选择 UserInfo 表

// 获取所有用户
const getallUserInfo = () => {
  return new Promise((result, err) => {
    let alluser = ResultUser.getAllUserInfo();
    result(alluser);
  })
}

// 搜索学员 获得搜索学员的名字 没有找到返回0 找到返回用户信息对象
const SecarhStudent = (alluser,studentName)=>{
  console.log(alluser,studentName)
  return new Promise((result,err)=>{
      for (var i = 0; i < alluser.length; i++) {
        if (alluser[i].realName == studentName) { // 就是搜索到了用户
          result(alluser[i]); //找到返回该用户的信息
          console.log("找到了", alluser[i])
          return;
        }
        
        if (i == alluser.length- 1){
          result(0) // 没有找到 返回 0
        }
      }
  })
}
// 暂停 或 允许 用户的学车操作 更新云数据库用户表的  
const stopAndstartUserTestcar=(usertb_id,start_or_stop)=>{
  return new Promise((result,err)=>{
    wx.cloud.callFunction({
      name: 'updateTestSetup', data: { tb_id: usertb_id, start_or_stop: start_or_stop } // 调用云更新是否被暂停练车状态函数
    }).then(res => {
      console.log(res.errMsg)
      result(res.errMsg)
    })
  })
}
module.exports = {
  getallUserInfo, // 获取所有用户信息
  SecarhStudent, // 搜索用户
  stopAndstartUserTestcar // 练车操作
}