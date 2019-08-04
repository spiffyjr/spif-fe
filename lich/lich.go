package lich

import (
	"flag"
	"strings"

	ps "github.com/mitchellh/go-ps"
	"github.com/shirou/gopsutil/process"
)

type Process struct {
	Character string `json:"character"`
	Port      int    `json:"port"`
}

func Processes() ([]Process, error) {
	var (
		detachableClient int
		login            string
		withoutFrontend  bool
	)

	// flag set to help with parsing the args
	fs := flag.NewFlagSet("", flag.ContinueOnError)
	fs.BoolVar(&withoutFrontend, "without-frontend", false, "")
	fs.IntVar(&detachableClient, "detachable-client", 0, "")
	fs.StringVar(&login, "login", "", "")

	// using go-ps for this list is a lot faster than what process provides
	pids, err := ps.Processes()
	if err != nil {
		return nil, err
	}

	var processes []Process
	for _, pid := range pids {
		if !strings.HasPrefix(pid.Executable(), "ruby") {
			continue
		}

		proc, err := process.NewProcess(int32(pid.Pid()))
		if err != nil {
			return nil, err
		}

		cmd, err := proc.Cmdline()
		if err != nil {
			continue
		}

		args := strings.Split(cmd, " ")
		if args[0] != "ruby" {
			continue
		}

		// find the start of args for flagSet.Parse()
		var argIdx int
		for argIdx = range args {
			if strings.HasPrefix(args[argIdx], "-") {
				break
			}
		}

		fs.Parse(args[argIdx:])

		// we only care about clients we can connect to
		if !withoutFrontend || detachableClient == 0 {
			continue
		}

		processes = append(processes, Process{
			Port:      detachableClient,
			Character: login,
		})
	}

	return processes, nil
}
