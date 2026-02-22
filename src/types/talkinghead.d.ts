declare module '@met4citizen/talkinghead' {
    export class TalkingHead {
        constructor(container: HTMLElement, options?: any);
        showAvatar(options: any): Promise<void>;
        speakText(text: string, options?: any): void;
        speakAudio(options: any): void;
        streamStart(options: any, onStart?: () => void, onEnd?: () => void): void;
        streamAudio(data: any): void;
        streamNotifyEnd(): void;
        streamStop(): void;
        audioCtx: AudioContext;
        lipsync: Record<string, any>;
    }
}

declare module '@met4citizen/talkinghead/modules/lipsync-en.mjs' {
    export class LipsyncEn {
        constructor();
        preProcessText(s: string): string;
        wordsToVisemes(w: string): any;
    }
}
