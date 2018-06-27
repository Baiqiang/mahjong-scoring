import { Pair, Chow, ExposedPung, ConcealedPung, Knitted, FullyKnitted, ThirteenOrphans } from "../meld.mjs"
import { knittedList } from "../utils.mjs"

export default class Scoring {
  constructor(
    hand,
    {isSelfDrawn = false, isLastTileShown = false, isKong = false, isLastTile = false} = {}
  ) {
    this.hand = hand
    this.isSelfDrawn = isSelfDrawn
    this.isLastTileShown = isLastTileShown
    this.isKong = isKong
    this.isLastTile = isLastTile
  }

  * getAllCombinations() {
    const Pung = this.isSelfDrawn ? ConcealedPung : ExposedPung
    function* expand(tiles, size, min = 0) {
      let alreadyHasPair = size % 3 !== 2
      let melds = []
      for (let tile = 27; tile < 34; ++tile) {
        if (tiles[tile] === 2) {
          if (alreadyHasPair) {
            return
          }
          alreadyHasPair = true
          tiles[tile] = 0
          size -= 2
          melds.push(new Pair(tile))
        } else if (tiles[tile] === 3) {
          tiles[tile] = 0
          size -= 3
          melds.push(new Pung(tile))
        } else if (tiles[tile] !== 0) {
          return
        }
      }
      while (min < 27 && tiles[min] === 0) {
        ++min
      }
      if (min === 27) {
        yield melds.slice()
        return
      }
      if (!alreadyHasPair) {
        for (let tile = 0; tile < 27; ++tile) {
          if (tiles[tile] >= 2) {
            let newTiles = tiles.slice()
            newTiles[tile] -= 2
            while (min < 27 && newTiles[min] === 0) {
              ++min
            }
            for (let result of expand(newTiles, size - 2, min)) {
              yield [...result, new Pair(tile), ...melds]
            }
          }
        }
      } else if (tiles[min] === 1) {
        let tile = min
        if (min % 9 >= 7 || tiles[min + 1] === 0 || tiles[min + 2] === 0) {
          return
        }
        let newTiles = tiles.slice()
        newTiles[min] = 0
        --newTiles[min + 1]
        --newTiles[min + 2]
        while (min < 27 && newTiles[min] === 0) {
          ++min
        }
        for (let result of expand(newTiles, size - 3, min)) {
          yield [...result, new Chow(tile + 1), ...melds]
        }
      } else if (tiles[min] === 2) {
        let tile = min
        if (tile % 9 >= 7 || tiles[tile + 1] <= 1 || tiles[tile + 2] <= 1) {
          return
        }
        let newTiles = tiles.slice()
        newTiles[tile] = 0
        newTiles[tile + 1] -= 2
        newTiles[tile + 2] -= 2
        while (min < 27 && newTiles[min] === 0) {
          ++min
        }
        for (let result of expand(newTiles, size - 6, min)) {
          yield [...result, new Chow(tile + 1), new Chow(tile + 1), ...melds]
        }
      } else if (tiles[min] === 3) {
        let tile = min
        let newTiles1 = tiles.slice()
        newTiles1[tile] = 0
        let min1 = min
        while (min1 < 27 && newTiles1[min1] === 0) {
          ++min1
        }
        for (let result of expand(newTiles1, size - 3, min1)) {
          yield [...result, new Pung(tile), ...melds]
        }
        if (tile % 9 >= 7 || tiles[tile + 1] <= 2 || tiles[tile + 2] <= 2) {
          return
        }
        let newTiles2 = tiles.slice()
        newTiles2[tile] = 0
        newTiles2[tile + 1] -= 3
        newTiles2[tile + 2] -= 3
        let min2 = min
        while (min2 < 27 && newTiles2[min2] === 0) {
          ++min2
        }
        for (let result of expand(newTiles2, size - 6, min2)) {
          yield [...result, new Chow(tile + 1), new Chow(tile + 1), new Chow(tile + 1), ...melds]
        }
      } else if (tiles[min] === 4) {
        let tile = min
        if (tile % 9 >= 7 || tiles[tile + 1] === 0 || tiles[tile + 2] === 0) {
          return
        }
        let newTiles1 = tiles.slice()
        newTiles1[tile] = 0
        --newTiles1[tile + 1]
        --newTiles1[tile + 2]
        let min1 = min
        while (min1 < 27 && newTiles1[min1] === 0) {
          ++min1
        }
        for (let result of expand(newTiles1, size - 6, min1)) {
          yield [...result, new ConcealedPung(tile), new Chow(tile + 1), ...melds]
        }
        if (tiles[min + 1] < 4 || tiles[min + 2] < 4) {
          return
        }
        let newTiles2 = tiles.slice()
        newTiles2[tile] = 0
        newTiles2[tile + 1] = 0
        newTiles2[tile + 2] = 0
        let min2 = min
        while (min2 < 27 && newTiles2[min2] === 0) {
          ++min2
        }
        for (let result of expand(newTiles2, size - 12, min2)) {
          yield [...result, new Chow(tile + 1), new Chow(tile + 1), new Chow(tile + 1), new Chow(tile + 1), ...melds]
        }
      }
    }

    if (this.hand.isNormalHand()) {
      let tiles = this.hand.tiles.slice()
      ++tiles[this.hand.waitTile]
      let knittedOffset = getKnittedOffset(tiles)
      let knitted = knittedOffset == null ? null : new Knitted(knittedOffset)
      for (let result of expand(tiles, this.hand.size + 1, 0)) {
        if (knitted) {
          result.push(knitted)
        }
        result.push(...this.hand.chows, ...this.hand.pungs, ...this.hand.exposedKongs, ...this.hand.concealedKongs)
        yield result
      }
    }

    if (this.hand.isSevenPairs()) {
      let pairs = []
      for (let tile = 0; tile < 34; ++tile) {
        switch (this.hand.fullTiles[tile]) {
          case 4:
            pairs.push(new Pair(tile))
          case 2:
            pairs.push(new Pair(tile))
        }
      }
      yield pairs
    }

    if (this.hand.isFullyKnitted()) {
      let {offset, voids} = getFullyKnittedParams(this.hand.fullTiles)
      yield [new FullyKnitted(offset, voids)]
    }

    if (this.hand.isThirteenOrphans()) {
      yield [new ThirteenOrphans(this.hand.fullTiles.findIndex(tile => tiles[tile] === 2))]
    }
  }
}

function getKnittedOffset(tiles) {
  const offsetTable = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
  for (let i = 0; i < 6; ++i) {
    if (knittedList[i].every(tile => tiles[tile] > 0)) {
      return offsetTable[i]
    }
  }
}

function getFullyKnittedParams(tiles) {
  const offsetTable = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
  const knittedMask = [0o421, 0o241, 0o412, 0o142, 0o214, 0o124]
  for (let count of tiles) {
    if (count > 1) {
      return false
    }
  }
  let mask = 0
  for (let suit = 0; suit < 3; ++suit) {
    for (let number = 1; number <= 9; ++number) {
      mask |= tiles[suit * 9 + number - 1] << (suit * 3 + (number - 1) % 3)
    }
  }
  let knittedIndex = knittedMask.indexOf(mask)
  let voids = []
  for (let tile of knittedList[knittedIndex]) {
    if (tiles[tile] === 0) {
      voids.push(tile)
    }
  }
  for (let index = 27; index < 34; ++index) {
    if (tiles[index] === 0) {
      voids.push(index)
    }
  }
  return {offset: offsetTable[knittedIndex], voids}
}