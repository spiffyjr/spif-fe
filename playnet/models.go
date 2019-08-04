package playnet

type Instance struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type Character struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type LoginData struct {
	Host string `json:"host"`
	Port int    `json:"port"`
	Key  string `json:"key"`
}
