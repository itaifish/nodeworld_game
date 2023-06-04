import EventEmitter from 'events';
import type BaseBuilding from '../board/building/BaseBuilding';
import { log } from 'src/utility/logger';

export default class SelectedBuildingManager extends EventEmitter {
	private selectedBuilding: BaseBuilding | null;

	public static readonly instance = new SelectedBuildingManager();
	public static readonly SELECT_EVENT = 'SELECT_EVENT';

	private constructor() {
		super();
		this.selectedBuilding = null;
	}

	setSelectedBuilding(newSelectedBuilding: BaseBuilding | null) {
		this.selectedBuilding?.setSelected(false);
		this.selectedBuilding = newSelectedBuilding;
		this.selectedBuilding?.setSelected(true);
		log.trace(`Set selected building called on ${newSelectedBuilding?.building.type || 'null'}`);
		this.emit(SelectedBuildingManager.SELECT_EVENT, this.selectedBuilding);
	}

	getSelectedBuilding() {
		return this.selectedBuilding;
	}

	on(eventName: typeof SelectedBuildingManager.SELECT_EVENT, listener: (data: BaseBuilding | null) => void): this {
		return super.on(eventName, listener);
	}
}
