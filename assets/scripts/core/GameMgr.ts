import { Joint2D, _decorator,sys } from 'cc';
class GameMgr {
    private static _inst: GameMgr;
    static get inst () {
        if (this._inst) {
            return this._inst;
        }
        this._inst = new GameMgr();
        return this._inst;
    }
    //--game data
    readonly OPEN_CARD_DONE = "OPEN_CARD_DONE";
    private readonly GAME_DATA = "GAME_DATA";
    isResume = false;
    gameData = {
        level:1,
        turn:0,
        score:0,
        bestScore:0,
        match:0,
        back:0,//card back
        table:[
            [0,0,0],
            [0,0,0],
            [0,0,0]
        ]
    }
    gameLevels = [
        {row:3,col:3},
        {row:4,col:4},
        {row:5,col:5},
        {row:6,col:6},
        {row:7,col:7},
        {row:8,col:8},
        {row:9,col:9},
        {row:10,col:10}
    ];
    saveData(){
        sys.localStorage.setItem(this.GAME_DATA,JSON.stringify(this.gameData));
    }
    loadSaveData(){
        let val = sys.localStorage.getItem(this.GAME_DATA);
        if(val!=null){
            this.gameData = JSON.parse(val);
        }
        else {
            this.saveData();
        }
    }
    resetLevel(){
        this.gameData.score = 0;
        this.gameData.turn =0;
        this.gameData.match = 0;
        this.gameData.table = [];
        this.saveData();
    }
    //--number anims
    public numberWithCommas(n:number) {
        if (n) {
            var result = (n = parseInt(n.toString())).toString().split(".");
            return result[0] = result[0].replace(/\B(?=(\d{3})+(?!\d))/g, "."),
            result.join(".")
        }
        return "0"
    }
    public getOnlyNumberInString(t) {
        var e = t.match(/\d+/g);
        return e ? e.join("") : ""
    }
    public shuffle(array: any){ 
        for (let i = array.length - 1; i > 0; i--) { 
          const j = Math.floor(Math.random() * (i + 1)); 
          [array[i], array[j]] = [array[j], array[i]]; 
        } 
        return array; 
    }
    public numberTo(obj, start, end, duration){
        clearInterval(obj.timer);
        var range = end - start;
        var minTimer = 50;
        var stepTime = Math.abs(Math.floor(duration / range));
        stepTime = Math.max(stepTime, minTimer);
        var startTime = new Date().getTime();
        var endTime = startTime + duration;
        let self = this;
        obj.timer = setInterval(function(){
            if (!!obj.node) {
                var now = new Date().getTime();
                var remaining = Math.max((endTime - now) / duration, 0);
                var value = (end - (remaining * range));
                obj.string = self.numberWithCommas(value);
                if (value == end) {
                    clearInterval(obj.timer);
                }
            }else clearInterval(obj.timer);
        }, stepTime);
    }
    
    public getRandomInt(min:number, max:number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
    }
}

export default GameMgr;