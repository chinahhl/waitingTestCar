// 调起手机拨号打电话
setOpenPhoneNumber=(PhoneNumber)=>{
  return new Promise((result, err)=>{
    wx.showActionSheet({
      itemList: [PhoneNumber],
      success: res=>{
        wx.makePhoneCall({
          phoneNumber: PhoneNumber,
          success: res=>{
            result(res)
          }
        })
      }
    })
    result("");
  })
}
module.exports = {
  setOpenPhoneNumber
}