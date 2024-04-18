import { _decorator, Component, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3 } from 'cc';
import { GameEvent } from '../core/GameEvent';
import GameMgr from '../core/GameMgr';
const { ccclass, property } = _decorator;

@ccclass('card')
export class card extends Component {
    @property({type:Node})
    back:Node | null = null;
    @property({type:Node})
    icon:Node | null = null;
    cardIdx = 0;
    posIdx = 0 ;//position of card on board
    isFlipping = false;
    readonly animationTime = 0.3;
    init(spBack:SpriteFrame, spIcon:SpriteFrame,cardIdx:number,posIdx:number){
        this.back.getComponent(Sprite).spriteFrame = spBack;
        this.icon.getComponent(Sprite).spriteFrame = spIcon;
        this.icon.active = false;
        this.back.active = true;
        this.cardIdx = cardIdx;
        this.posIdx = posIdx;
    }
    cardClick(){
        if(this.isFlipping) return;
        if(this.back.active === false) return;
        this.openCard();
    }
    private openCard(){
        this.isFlipping = true;
        tween(this.back).to(this.animationTime,{scale:new Vec3(-1,1,1)})
        .call(()=>{
            this.isFlipping = false;
            this.back.active = false;
            this.icon.active = true;
            this.back.scale = new Vec3(1,1,1);
            GameEvent.DispatchEvent(GameMgr.inst.OPEN_CARD_DONE,{cardIdx:this.cardIdx,posIdx:this.posIdx});
        }).start()
    }
    closeCard(){
        this.isFlipping = true;
        tween(this.icon).to(this.animationTime,{scale:new Vec3(-1,1,1)})
        .call(()=>{
            this.isFlipping = false;
            this.back.active = true;
            this.icon.active = false;
            this.icon.scale = new Vec3(1,1,1);
            GameEvent.DispatchEvent(GameMgr.inst.OPEN_CARD_DONE,{cardIdx:-1,posIdx:-1});
        }).start()
    }
    hideCard(){
        tween(this.node.getComponent(UIOpacity)).to(this.animationTime,{opacity:1}).start();
    }
    // update(deltaTime: number) {
        
    // }
}

