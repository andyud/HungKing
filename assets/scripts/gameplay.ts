import { _decorator, Component, Node, Label, Button, director, Prefab, UITransform, instantiate, Layout, Size, SpriteFrame, Game, Sprite } from 'cc';
import { AudioMgr } from './core/AudioMgr';
import GameMgr from './core/GameMgr';
import { card } from './components/card';
import { GameEvent } from './core/GameEvent';
import { result } from './result';
import { gameover } from './gameover';
const { ccclass, property } = _decorator;

@ccclass('gameplay')
export class gameplay extends Component {
    @property({ type: Node })
    btnHome: Node | null = null
    @property({ type: Node })
    btnSound: Node | null = null
    @property({ type: Label })
    lbMatches: Label | null = null;
    @property({ type: Label })
    lbTurns: Label | null = null;
    @property({ type: Label })
    lbLevel: Label | null = null;
    @property({ type: Label })
    lbScore: Label | null = null;
    @property({ type: Sprite })
    spTimer: Sprite | null = null;

    //--gameplay
    @property({ type: Node })
    board: Node | null = null;
    @property({ type: Prefab })
    pfCard: Prefab | null = null;

    @property([SpriteFrame])
    sfCardBacks: SpriteFrame[] = []
    @property([SpriteFrame])
    sfCards: SpriteFrame[] = []
    previousCard = -1 //previous cardid
    previousPos = -1;
    clearCards = 0;

    //--result
    @property({type:Node})
    popupResult:Node | null = null;
    @property({type:Node})
    popupGameOver:Node | null = null;
    lastTimeUpdate= 0;
    enableTimer = false;
    start() {
        //sound
        AudioMgr.inst.playBgm();
        this.updateSoundButton();

        //add listener
        this.btnHome.on(Button.EventType.CLICK, this.onClick, this);
        this.btnSound.on(Button.EventType.CLICK, this.onClick, this);
        this.popupResult.getComponent(result).init((iCommand:number)=>{
            if(iCommand===1) {
                //restart
                this.prepareGameLevel();
                this.loadGameLevel();
            } else {
                GameMgr.inst.gameData.level++;
                if(GameMgr.inst.gameData.level>=GameMgr.inst.gameLevels.length){
                    GameMgr.inst.gameData.level = 1;
                }
                this.prepareGameLevel();
                this.loadGameLevel();
            }
            GameMgr.inst.saveData();
        });
        this.popupResult.active = false;
        this.popupGameOver.getComponent(gameover).init((iCommand:number)=>{
            if(iCommand===1) {
                //restart
                this.prepareGameLevel();
                this.loadGameLevel();
            } else {
                this.goHome();
            }
            GameMgr.inst.saveData();
        });
        this.popupGameOver.active = false;
        this.initCardEvent();
        //--
        if (GameMgr.inst.isResume) {
            GameMgr.inst.isResume = false;
            this.loadGameLevel();
        } else {
            this.prepareGameLevel();//prepare data before load
            this.loadGameLevel();
        }
    }
    onClick(button: Button) {
        AudioMgr.inst.playSound('click')
        switch (button.node.name) {
            case 'btnHome':
                this.goHome();
                break;
            case 'btnSound':
                AudioMgr.inst.soundToggle();
                this.updateSoundButton();
                break;
        }
    }
    goHome(){
        GameEvent.RemoveEventListener(GameMgr.inst.OPEN_CARD_DONE);
        director.loadScene('home');
    }
    updateSoundButton() {
        if (AudioMgr.inst.iSoundOn) {
            this.btnSound.children[0].active = true;
            this.btnSound.children[1].active = false;
        } else {
            this.btnSound.children[0].active = false;
            this.btnSound.children[1].active = true;
        }
    }
    prepareGameLevel() {
        let level = GameMgr.inst.gameData.level;
        let row = GameMgr.inst.gameLevels[level - 1].row;
        let col = GameMgr.inst.gameLevels[level - 1].col;
        let totalCard = row * col;
        let cards = [];
        for (let i = 0; i < totalCard; i++) {
            let idx = GameMgr.inst.getRandomInt(0, this.sfCards.length - 1);
            cards.push(idx);
            i++;
            cards.push(idx);
        }
        GameMgr.inst.shuffle(cards);

        //--set card back idx
        GameMgr.inst.gameData.back = level % this.sfCardBacks.length;

        //--set card idx
        GameMgr.inst.resetLevel();
        let count = 0;
        for (let i = 0; i < row; i++) {
            let arr = [];
            for (let j = 0; j < col; j++) {
                let idx = cards[count];
                arr.push(idx);
                count++;
            }
            GameMgr.inst.gameData.table.push(arr);
        }
        GameMgr.inst.shuffle(GameMgr.inst.gameData.table)
    }
    loadGameLevel() {
        //--info
        this.lbTurns.string = `${GameMgr.inst.gameData.turn}`;
        this.lbMatches.string = `${GameMgr.inst.gameData.match}`;
        this.lbLevel.string = `LV: ${GameMgr.inst.gameData.level}`;
        this.lbScore.string = `${GameMgr.inst.gameData.score}`;
        this.startTimer();
        this.clearCards = 0;

        //set size of board
        let level = GameMgr.inst.gameData.level;
        let row = GameMgr.inst.gameLevels[level - 1].row;
        let col = GameMgr.inst.gameLevels[level - 1].col;
        let w = this.getComponent(UITransform).width;
        let h = this.getComponent(UITransform).height;
        let boardW = w * 3 / 5;
        let boardH = h * 9 / 10;
        this.board.getComponent(UITransform).setContentSize(boardW, boardH);

        //compute item size
        this.board.removeAllChildren();
        let maxRC = row > col ? row : col;
        let minSize = boardW > boardH ? boardH : boardW;
        let itemSize = (minSize / maxRC) * 0.8;
        let spaceW = (boardW - itemSize * col) / (col + 1);
        let spaceH = (boardH - itemSize * row) / (row + 1);
        this.board.getComponent(Layout).spacingX = spaceW;
        this.board.getComponent(Layout).spacingY = spaceH;
        this.board.getComponent(Layout).paddingLeft = spaceW;
        this.board.getComponent(Layout).paddingTop = spaceH;

        //--
        let table = GameMgr.inst.gameData.table;
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                let item = instantiate(this.pfCard);
                item.getComponent(UITransform).setContentSize(itemSize, itemSize);

                let sfBack = this.sfCardBacks[GameMgr.inst.gameData.back];
                let cardIdx = table[i][j];
                if (cardIdx === -1) {
                    this.clearCards++;
                    item.getComponent(card).hideCard();
                } else {
                    let sfCard = this.sfCards[cardIdx];
                    item.getComponent(card).init(sfBack, sfCard, cardIdx, this.board.children.length,i,j);
                    //--add click event
                    item.on(Button.EventType.CLICK, this.onCard, this);
                }
		        this.board.addChild(item);
            }
        }
    }
    initCardEvent() {
        GameEvent.AddEventListener(GameMgr.inst.OPEN_CARD_DONE, (data: any = null) => {
            if (data != null) {
                if (this.previousCard === -1) {
                    this.previousCard = data.cardIdx;
                    this.previousPos =  data.posIdx;
                } else {
                    if (data.cardIdx === this.previousCard) {//match
                        this.board.children[this.previousPos].getComponent(card).hideCard();
                        this.board.children[data.posIdx].getComponent(card).hideCard();
                        GameMgr.inst.gameData.match++;
                        this.lbMatches.string = `${GameMgr.inst.gameData.match}`;
                        GameMgr.inst.numberTo(this.lbScore, GameMgr.inst.gameData.score, GameMgr.inst.gameData.score+100,500);
                        GameMgr.inst.gameData.score+=100;
                        if(GameMgr.inst.gameData.bestScore<GameMgr.inst.gameData.score){
                            GameMgr.inst.gameData.bestScore = GameMgr.inst.gameData.score;
                        }
                        AudioMgr.inst.playSound("matching");
                        this.clearCards+=2;
                        let remainCard = this.board.children.length - this.clearCards;
                        this.startTimer();
                        if(remainCard<=1){//level done
                            GameMgr.inst.gameData.match = 0;
                            GameMgr.inst.gameData.turn = 0;
                            GameMgr.inst.gameData.score = 0;
                            this.board.children.forEach(element => {
                                if(!element.getComponent(card).isClear){
                                    element.getComponent(card).hideCard();
                                }
                            });
                            //--show game result
                            this.popupResult.getComponent(result).show();
                            let timeout = setTimeout(()=>{
                                clearTimeout(timeout);
                                AudioMgr.inst.playSound('win');
                            }, 200);
                            this.stopTimer();
                        }
                        this.previousCard = -1;
                        this.previousPos = -1;
                    } else {//not match
                        this.board.children[this.previousPos].getComponent(card).closeCard();
                        this.board.children[data.posIdx].getComponent(card).closeCard();
                        GameMgr.inst.gameData.turn++;
                        this.lbTurns.string = `${GameMgr.inst.gameData.turn}`;
                        this.previousCard = -1;
                        this.previousPos = -1;
                        AudioMgr.inst.playSound("wrong");
                    }
                }
            }
        })
    }
    onCard(button: Button) {
        AudioMgr.inst.playSound('click')
        button.node.getComponent(card).cardClick();
    }
    startTimer(){
        this.lastTimeUpdate = new Date().getTime();
        this.spTimer.fillRange = 1;
        this.enableTimer = true;
    }
    stopTimer(){
        this.enableTimer = false;
    }
    update(deltaTime: number) {
        if(this.enableTimer){
            let currentTime = new Date().getTime();
            if(currentTime - this.lastTimeUpdate>50){//1s
                this.lastTimeUpdate = currentTime;
                this.spTimer.fillRange-=0.005;
                if(this.spTimer.fillRange<=0){
                    this.spTimer.fillRange = 0;
                    this.stopTimer();
                    AudioMgr.inst.playSound('lost');
                    GameMgr.inst.resetLevel();
                    this.popupGameOver.getComponent(gameover).show();
                }
            }
        }
    }
}


