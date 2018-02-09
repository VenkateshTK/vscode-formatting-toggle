import { commands, Disposable, StatusBarItem } from 'vscode'
import {
  COMMAND_NAME,
  FORMATTING_SETTINGS,
  CONFIGURATION_TARGET
} from './constants'
import getEditorConfiguration from './helpers/getEditorConfiguration'
import getFormattingConfiguration, {
  FormattingConfiguration
} from './helpers/getFormattingConfiguration'
import isFormattingActivated from './helpers/isFormattingActivated'
import getStatusBarText from './helpers/getStatusBarText'

interface InitCommandArgs {
  statusBar: StatusBarItem
  shouldDisable: boolean
  savedFormattingConfiguration: FormattingConfiguration
}

const initCommand = ({
  statusBar,
  shouldDisable,
  savedFormattingConfiguration
}: InitCommandArgs): Disposable =>
  commands.registerCommand(`extension.${COMMAND_NAME}`, () => {
    // Always re-update the toggle status in case the user has changed their
    // config manually between two executions.
    // The status bar text has automatically been updated already using the
    // `onDidChangeConfiguration` event.
    const editorConfiguration = getEditorConfiguration()
    const formattingConfiguration = getFormattingConfiguration(
      editorConfiguration
    )
    shouldDisable = isFormattingActivated(formattingConfiguration)

    if (shouldDisable) {
      // Save the formatting configuration before disabling it so that it can
      // be restored on the next execution.
      savedFormattingConfiguration = formattingConfiguration
    }

    FORMATTING_SETTINGS.forEach(setting => {
      if (shouldDisable) {
        return editorConfiguration.update(setting, false, CONFIGURATION_TARGET)
      }

      // `formatOnType` should only be toggled on if the user had enabled it
      // beforehand.
      if (setting === 'formatOnType') {
        const initialValue = savedFormattingConfiguration[setting]
        return editorConfiguration.update(
          setting,
          initialValue,
          CONFIGURATION_TARGET
        )
      }

      // The other formatting settings are *probably* safe to be toggled on.
      return editorConfiguration.update(setting, true, CONFIGURATION_TARGET)
    })

    shouldDisable = !shouldDisable
    statusBar.text = getStatusBarText(shouldDisable)
  })

export default initCommand
