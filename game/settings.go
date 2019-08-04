package game

type Settings struct {
	Highlights []SettingsHighlight `json:"highlights"`
	LichPath   string              `json:"lichPath"`
	Macros     []SettingsMacro     `json:"macros"`
}

type SettingsMacro struct {
	Key string `json:"key"`
	Cmd string `json:"cmd"`
}

type SettingsHighlight struct {
	Pattern string `json:"pattern"`
	Color   string `json:"color"`
}
