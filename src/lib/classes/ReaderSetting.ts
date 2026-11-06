export class ReaderSetting {
	bgColor: string;
	fontSize: number;
	fontFamily: string;
	soundTrack: string;

	constructor(
		bgColor = '#fdf6e3',
		fontSize = 20,
		fontFamily = 'sans-serif',
		soundTrack = 'rain'
	) {
		this.bgColor = bgColor;
		this.fontSize = fontSize;
		this.fontFamily = fontFamily;
		this.soundTrack = soundTrack;
	}
}