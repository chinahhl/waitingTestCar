// wx.cloud.init({env: 'online-pzcut'})

// 用户点击的申请成为学员
applyAstudent=(userobj)=>{
  return new Promise((result,err)=>{
    wx.cloud.callFunction({
      name: 'applyAstudent', data: { userobj: userobj } // 调用申请成为学员云函数
    }).then(res => {
      // console.log(res.errMsg);
      result(res.errMsg)
    })
  })
}
module.exports = {
  applyAstudent // 添加到用户申请表用
}
