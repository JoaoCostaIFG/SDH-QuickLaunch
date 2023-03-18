import { ServerAPI } from "decky-frontend-lib";

import { App, getLaunchOptions, getTarget } from "./apptypes";

export const createShortcut = (name: string) => {
    return SteamClient.Apps.AddShortcut(name,"/usr/bin/ifyouseethisyoufoundabug") //The Part after the last Slash does not matter because it should always be replaced when launching an app
}

export const gameIDFromAppID = (appid: number) => {
    //@ts-ignore
    let game = appStore.GetAppOverviewByAppID(appid);

    if(game !== null) {
        return game.m_gameid;
    } else {
        return -1
    }
}

export async function fetchApps(sAPI: ServerAPI, type: string): Promise<App[]> {
    const result = await sAPI.callPluginMethod<any, string>(`get_${type}`, {}); 
    let apps: App[] = []
    if(result.success) {
        //...i guess it works
        let apps_withDuplicates: App[] = JSON.parse(result.result);

        let names: String[] = []
        for(let app of apps_withDuplicates) {
            if(!names.includes(app.name) && app.name !== "") {
                names.push(app.name)
            }
        }
        for(let name of names) {
            let app = apps_withDuplicates.find(app => app.name === name);
            if(app !== undefined) {
                apps.push(app);
            }
        }

        apps.sort((a, b) => { 
            if(a.name < b.name) { return -1; }
            if(a.name > b.name) { return 1; }
            return 0;
        })
    }

    return apps
  }
  
export const launchApp = async (sAPI: ServerAPI, app: App) => {
    let id: number = await getShortcutID(sAPI);       
    
    SteamClient.Apps.SetShortcutName(id, `[QL] ${app.name}`)
    SteamClient.Apps.SetShortcutLaunchOptions(id, getLaunchOptions(app))
    SteamClient.Apps.SetShortcutExe(id, `"${getTarget(app)}"`)

    setTimeout(() => {
        let gid = gameIDFromAppID(id);
        SteamClient.Apps.RunGame(gid,"",-1,100);
    }, 500)
  }

export const getShortcutID = async (sAPI: ServerAPI) => {
    const result = await sAPI.callPluginMethod<any, number>("get_id", {})

    if(result.success) {
        let id: number = result.result;

        if(id == -1) {
            id = await createShortcut("QuickLaunch");
            sAPI.callPluginMethod("set_id", {id: id});
        } else if(await gameIDFromAppID(id) == -1) {
            id = await createShortcut("QuickLaunch");
            sAPI.callPluginMethod("set_id", {id: id});
        }

        return id
    }
    
    return -1
}