const core = require('@actions/core');
const { spawnSync } = require("child_process");
const fs = require('fs');
const path = require('path')
const splitString = require('split-string');

// Setup Docker
const Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

try {

  // Get inputs
  var docker_image = core.getInput('containerImage');
  var work_dir = core.getInput('directory');
  var use_container = core.getInput('useContainer');
  var godot_executable = core.getInput('godotExecutable');
  var flags = core.getInput('godotFlags');
  var gut_config = core.getInput('gutConfigPath');
  var import_resources = core.getInput('importGodotResources');
  // var download_gut = core.getInput('downloadGut');

  flags = splitString(flags, {separator: ' ', quotes: ['"', "'"]});

  if(gut_config){
    if(use_container == "true")
    {
      gut_config = path.join('/project', gut_config);
    }
    flags.push('-gconfig', gut_config);
  }
  if(work_dir)
  {
    process.chdir(work_dir);
  }

  if(use_container == "true")
  {

    // Pull docker image for building
    console.log("Pulling build image...");
    docker.pull(docker_image, function(err, stream)
    {

      docker.modem.followProgress(stream, onFinished, onProgress);

      // Wait to run build until after pull complete
      function onFinished(err, output)
      {
        console.log("Starting image...");
        console.log("Starting import run...");
        docker.run(docker_image, [godot_executable, '--headless', '--verbose', '--import', '--path', '/project'], process.stdout,
        // console.log("Starting test run...");
        // docker.run(docker_image, [godot_executable, ...flags, '-s', '--path', '/project', 'addons/gut/gut_cmdln.gd'], process.stdout,

          // Mount working directory to `/project`
          { HostConfig: { Binds: [ process.cwd() + ":/project" ] }},

          function (err, data, container) {

            if(err)
            {
              core.setFailed(error.message);
            }

            console.log("Tests exited with status: " + data.StatusCode);

            if( data.StatusCode != "0" )
            {
                core.setFailed("GUT tests failed!");
            }

        })
      }
      function onProgress(event) {}

    });
  }
  else
  {
    console.log("Running GUT tests locally");
    var quoted_flags = flags.map(f => `"${f.replace(/"\\/g, m => `\\${m}`)}"`).join(' ');
    var result = spawnSync(`${godot_executable} ${quoted_flags} -s --path . addons/gut/gut_cmdln.gd`, {
      stdio: 'inherit',
      shell: true
    });

    if(result.status != null && result.status != 0)
    {
      core.setFailed("GUT tests failed!");
    }

  }

} catch (error) {
  core.setFailed(error.message);
}
