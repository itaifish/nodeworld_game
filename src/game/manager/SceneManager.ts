import type BackgroundScene from '../scene/BackgroundScene';
import type ConstructBuildingUIScene from '../scene/ConstructBuildingUIScene';
import type MainScene from '../scene/MainScene';
import type UIScene from '../scene/UIScene';

export default class SceneManager {
	public static readonly instance = new SceneManager();

	public mainScene?: MainScene;
	public backgroundScene?: BackgroundScene;
	public constructBuildingUIScene?: ConstructBuildingUIScene;
	public userInterfaceScene?: UIScene;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}
}
