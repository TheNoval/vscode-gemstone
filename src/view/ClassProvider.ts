import * as vscode from 'vscode';
import { GsClass } from '../model/GsClass';
import { Session } from '../model/Session';
import { SymbolDictionary } from '../model/SymbolDictionary';

export class ClassesProvider implements vscode.TreeDataProvider<GsClass> {
	private session: Session | null = null;
	private _onDidChangeTreeData: vscode.EventEmitter<GsClass | undefined> = new vscode.EventEmitter<GsClass | undefined>();
	readonly onDidChangeTreeData: vscode.Event<GsClass | undefined> = this._onDidChangeTreeData.event;
	private symbolList: Array<SymbolDictionary> = [];
	activeDictionary: { oop: number, name: string, size: number } | null = null;
	classHierarchy: any = {};
	classSuperPairs: any = {};
	allClasses: string[] = [];

	constructor() {
	}

	async displayClassFinder() {
		if (!this.session) {
			console.log("NO SESSION ACTIVE");
			return;
		}
		if (this.allClasses.length == 0) {
			var allClassesString = await this.session.stringFromPerform('getAllClasses', [], 65525);
			this.allClasses = JSON.parse(allClassesString);
		}
		vscode.window.showQuickPick(this.allClasses)
			.then(console.log)
	}

	async getChildren(element?: GsClass): Promise<GsClass[]> {
		if (!this.session) {
			return Promise.resolve([]);
		}
		if (element) {
			if (this.hasChildren(element.label)) {
				return Promise.resolve(
					this.classSuperPairs[element.label].map((obj: any): GsClass => {
						return new GsClass(
							obj.key,
							this.hasChildren(obj.key) ?
								vscode.TreeItemCollapsibleState.Collapsed :
								vscode.TreeItemCollapsibleState.None,
							{
								command: "gemstone.fetchMethods",
								title: "doc",
								arguments: [obj]
							}
						)
					})
				);
			} else {
				return Promise.resolve([]);
			}
		}
		return Promise.resolve([new GsClass("Object", vscode.TreeItemCollapsibleState.Expanded)]); // TODO: FETCH METHODS FOR OBJECT
	}

	getHierarchyFromPairs(pairs: { [x: string]: any[]; }, key = "Object") {
		var hierarchy: { [k: string]: any } = {};
		if (key in Object.keys(pairs)) {
			for (var i = 0; i < pairs[key].length; i++) {
				var tempObj = pairs[key][i];
				pairs[key].splice(i, 1);
				if (!(key in hierarchy)) {
					hierarchy[key] = [];
				}
				hierarchy[key].push(this.getHierarchyFromPairs(pairs, tempObj.key));
				pairs[key].splice(i, 0, tempObj);
			}
			return hierarchy;
		}
		return { [key]: [] };
	}

	getSymbolDictionaryNames() {
		return Array.from(this.symbolList.keys());
	}

	getTreeItem(element: GsClass): vscode.TreeItem {
		return element;
	}

	hasChildren(name: string): boolean {
		return Object.keys(this.classSuperPairs).indexOf(name) > -1
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	async setSession(session: Session | null): Promise<void> {
		return new Promise(async (resolve, reject) => {
			this.session = session;
			if (session === null) {
				resolve();
				return;
			}
			// obtain list of SymbolDictionary instances
			try {
				// this.symbolList = await this.session!.getSymbolList();
				resolve();
			} catch (ex: any) {
				reject(ex);
			}
		});
	}

	setSymbolDictionary(selection: string | undefined): void {
		if (selection && this.session) {
			// 	this.activeDictionary = this.symbolDictionaries[selection];
			// 	const myString = this.session.stringFromPerform(
			// 		this.jadeServer,
			// 		'getClassesInDictionary:',
			// 		[this.activeDictionary.oop],
			// 		65525
			// 	);
			// 	JSON.parse(myString).list.forEach((element: any) => {
			// 		if (this.session) {
			// 			var superClass = this.session.stringFromPerform(
			// 				this.jadeServer,
			// 				'getAncestor:',
			// 				[element.oop],
			// 				65525
			// 			);
			// 			if (this.classSuperPairs[superClass]) {
			// 				this.classSuperPairs[superClass].push(element);
			// 			} else {
			// 				this.classSuperPairs[superClass] = [element];
			// 			}
			// 		}
			// 	});
			// 	this.classHierarchy = this.getHierarchyFromPairs(this.classSuperPairs);
		} else {
			this.activeDictionary = null;
		}
	}
}
