import Fan from "../fan"

export default class FourKongs extends Fan {
  get name() {
    return '四杠'
  }

  _process() {
    if (this.melds.length !== 5) {
      return
    }
    if (this.melds[1].isKong() && this.melds[2].isKong() && this.melds[3].isKong() && this.melds[4].isKong()) {
      this.fans.push(this.name)
      this.addOmittedFans(['三杠', '双明杠', '明杠', '碰碰和', '单调将'])
    }
  }
}