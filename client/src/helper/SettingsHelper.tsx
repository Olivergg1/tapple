import { createStore, Part } from "solid-js/store";
import { getGame } from "./GameHelper";
const env = import.meta.env

type TappleTheme = "light" | "dark"

const game = getGame()

export type TappleSettingValue = string | string[] | number | number[] | boolean | boolean[]

export interface TappleSetting {
  key: string
  value: TappleSettingValue
}

export interface TappleSettingCategory {
  categoryName: string
  settings?: TappleSetting[]
}

export interface TappleSettings {
  categories: TappleSettingCategory[]
}

// Default settings 
const defaultSettings: TappleSettings = {
  categories: [
    { 
      categoryName: "network", 
      settings: [
        { key: "server", value: env.VITE_SERVER_URL },
        { key: "protocol", value: env.VITE_SERVER_PROTOCOL },
        { key: "port", value: env.VITE_SERVER_PORT },
        { key: "theme", value: "light" }
      ] 
    },
    { 
      categoryName: "User", 
      settings: [
        { key: "preferred_color", value: "blue" },
        { key: "email", value: "example@tapple.olivergg1.com" }
      ] 
    },
    { 
      categoryName: "developer", 
      settings: [
        { key: "developer_mode", value: false },
        { key: "api_thing", value: "bla bla bla" }
      ] 
    }
  ]
}

const [settings, setSettings] = createStore<TappleSettings>(defaultSettings)

export const initalizeSettings = () => {
  // Check if stored settings in localstorage exists
  const settingsFromLocalStorage = localStorage.getItem("settings")
  if (settingsFromLocalStorage !== null && settingsFromLocalStorage !== "") {
    console.log("Retrieved an save from localStorage")
    setSettings(s => JSON.parse(settingsFromLocalStorage))
    return
  } else {
    localStorage.setItem("settings", JSON.stringify(settings))
    console.log("Saving settings to localStorage...")
  }
}

export const updateSetting = (category: string, key: Part<TappleSettingCategory[], number>, value: TappleSettingValue) => {
  setSettings("categories", (cgs) => cgs.categoryName === category, "settings", (s) => s.key === key, "value", value)
  localStorage.setItem("settings", JSON.stringify(settings))
}

export const getSettings = () => settings
//export const getSettings = () => [settings, updateSetting]

export const getSetting = (category: string, key: string): TappleSettingValue | null => {
  // Check if category exists
  const cat = getSettings().categories.find(c => c.categoryName === category)
  
  if (cat === undefined) {
    console.error("No such category")
    return null
  }

  // Check if setting exists, then return its value
  const setting = cat.settings?.find(s => s.key === key)
  
  if (setting === undefined) {
    console.error("No such setting")
    return null
  }

  return setting.value
}


export const restoreSettings = () => {
  console.log("restoring...")
  localStorage.removeItem("settings")
  console.log(localStorage.getItem("settings"))
  setSettings(defaultSettings)
  console.log(defaultSettings)
  localStorage.setItem("settings", JSON.stringify(settings))
}