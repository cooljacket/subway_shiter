// pages/subway_shiter.js
import {
  getAllLines,
  getLineColor,
  getLineStations,
  getStationWcInfo,
  getNearByStations,
} from "./subway_line_info";

Page({
  data: {
    city_name: "深圳",
    has_get_location_info: false, // 是否已获取地理位置信息
    location_permission: null,  // 地理位置授权，bool
    nearby_stations: [],  // 根据地理位置计算的附近洗手间信息
    lines: getAllLines(),
    line_stations: [],
    wc_info_list: [],
    selected_indexes: [0, 0, 0],  // picket-view的 value
    position: {
      latitude: 0,
      longitude: 0
    }
  },

  onGetLocation: function (location, is_click) {
    console.log('onGetLocation', location)

    // 判断地理位置是否有变化
    const ifPositionNoChange = (before, after) => {
      return Math.abs(before - after) < 1e-6
    }
    if (is_click && ifPositionNoChange(location.latitude, this.data.position.latitude) && ifPositionNoChange(location.longitude, this.data.position.longitude)) {
      wx.showToast({
        title: '地理位置没变化，可能网络信号弱',
        icon: "error"
      })
    }

    const nearby_stations = getNearByStations(location.latitude, location.longitude, 3)
    console.log('nearby_stations', nearby_stations)

    this.setData({
      location_permission: true,
      has_get_location_info: true,
      nearby_stations,
      position: {
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6),
      }
    })

    if (nearby_stations.length > 0) {
      const nearest_station = nearby_stations[0]
      this.changeSelectedStation([nearest_station.line_index, nearest_station.station_index, 0])
      console.log('hhh', [nearest_station.line_index, nearest_station.station_index, 0])
    } else {
      console.log('hhehehhehe empty', nearby_stations.length)
    }
  },

  searchNearByStationWcInfoHelper: function (is_click = true) {
    let that = this
    // 此函数仅在明确有权限时会调用，所以在这里设置 location_permission
    this.setData({
      location_permission: true
    })

    wx.getLocation({
      type: 'gcj02',
      success(res) {
        that.onGetLocation(res, is_click)
      },
      fail(res) {
        console.log('wx.getLocation fail', res)
      }
    })
  },

  searchNearByStationWcInfo: function (is_click = true) {
    let that = this

    // 检查是否已授权获取地理位置权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          // 已授权，可以直接使用地理位置信息
          that.searchNearByStationWcInfoHelper(is_click)
        } else {
          // 未授权，需要询问用户授权
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              // 用户同意授权，可以使用地理位置信息
              that.searchNearByStationWcInfoHelper(is_click)
            },
            fail: () => {
              that.setData({
                location_permission: false,
                has_get_location_info: false,
              })

              // 用户拒绝授权，提示用户打开设置页面授权
              wx.showModal({
                title: '提示',
                content: '未授权获取地理位置信息，无法使用该功能，请前往设置页面打开授权。',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        }
      }
    })
  },

  bindChange: function (e) {
    let indexes = e.detail.value
    let new_indexes = indexes
    if (indexes[0] !== this.data.selected_indexes[0]) {
      // 线路变了的话，其他两个下标要清零
      new_indexes[1] = 0
      new_indexes[2] = 0
    } else if (indexes[1] != this.data.selected_indexes[1]) {
      // 只是站点变了的话，洗手间的下标要清零
      new_indexes[2] = 0
    }
    this.changeSelectedStation(new_indexes)
  },

  changeSelectedStation: function (new_indexes) {
    console.log('changeSelectedStation', new_indexes)
    this.setData({
      line_stations: getLineStations(new_indexes[0]),
      wc_info_list: getStationWcInfo(new_indexes[0], new_indexes[1]),
      selected_indexes: new_indexes,
    })
  },

  onOpenFeedback: function () {
    let network_type = 'unknown'
    wx.getNetworkType({
      success(res) {
        network_type = res.networkType
      }
    })

    let customData = {
      clientInfo: "",
      clientVersion: "",
      os: "",
      osVersion: "",
      netType: network_type,
    }

    try {
      const res = wx.getSystemInfoSync()
      customData.clientInfo = res.brand
      customData.clientVersion = res.model
      customData.osVersion = res.system
      customData.os = res.platform
    } catch (e) {
      // Do something when catch error
    }

    console.log('customData', customData)
    wx.openEmbeddedMiniProgram({
      appId: "wx8abaf00ee8c3202e",
      extraData: {
        id: "632796",
        customData: customData
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 尝试根据最新的地理位置，搜索附近的站点，并查找其洗手间信息
    this.searchNearByStationWcInfo(false)
    // 初始化线路、站点的选择
    this.changeSelectedStation(this.data.selected_indexes)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})