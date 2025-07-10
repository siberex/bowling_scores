abstract class PlayerBase {
  def name: String
  def handicap: Int
  def roll(pins: Int, isSplit: Boolean): Nothing
  def getScoringSheet: ScoringSheet
}

class Player extends PlayerBase {

}

class ScoringSheet {

}
