import {
  getKarmaTarget,
  isBotCommand,
  getBotCommand,
  BotCommandType
} from '../detector'

describe('detector', () => {
  describe('getKarmaTarget', () => {
    const user = 'UA42B4D'

    describe('target finding', () => {
      describe('simple target finding', () => {
        it('finds the target, if it is the first word in the sentence', () => {
          const karmaTarget = getKarmaTarget('Ken++', user)!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the target, if it is the second word in the sentence', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++', user)!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the target, if there are words before and after', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++, lol', user)!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the first target, if there are multiple in a sentence', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++ and burgers++', user)!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the first target, if there are multiple in a sentence', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++ and burgers++', user)!
          expect(karmaTarget.target).toEqual('Ken')
        })
      })

      describe('complex target finding', () => {
        it('finds the target, if it has letters and numbers in it', () => {
          const karmaTarget = getKarmaTarget('l33tsp3ak++', user)!
          expect(karmaTarget.target).toEqual('l33tsp3ak')
        })

        it('finds the target, if it is only numbers', () => {
          const karmaTarget = getKarmaTarget('411++', user)!
          expect(karmaTarget.target).toEqual('411')
        })

        it('finds the target, if it has a & in it', () => {
          const karmaTarget = getKarmaTarget('L&L++', user)!
          expect(karmaTarget.target).toEqual('L&L')
        })

        it('finds the target, if it has a $ in it', () => {
          const karmaTarget = getKarmaTarget('$$$++', user)!
          expect(karmaTarget.target).toEqual('$$$')
        })

        it('finds the target, if it has a ( or ) in it', () => {
          const karmaTarget = getKarmaTarget('(hello)++', user)!
          expect(karmaTarget.target).toEqual('(hello)')
        })

        it('finds the target, if it has a [ or ] in it', () => {
          const karmaTarget = getKarmaTarget('[hello]++', user)!
          expect(karmaTarget.target).toEqual('[hello]')
        })

        it('finds the target, if it has a - in it', () => {
          const karmaTarget = getKarmaTarget('lisp-case++', user)!
          expect(karmaTarget.target).toEqual('lisp-case')
        })

        it('finds the target, if it has a many -s in it', () => {
          const karmaTarget = getKarmaTarget('long-lisp-case++', user)!
          expect(karmaTarget.target).toEqual('long-lisp-case')
        })

        it('finds the target, if it has a + in it', () => {
          const karmaTarget = getKarmaTarget('a+b++', user)!
          expect(karmaTarget.target).toEqual('a+b')
        })

        it('finds the target, if it has a many +s in it', () => {
          const karmaTarget = getKarmaTarget('a+b+c++', user)!
          expect(karmaTarget.target).toEqual('a+b+c')
        })

        it('finds the target, if it has a _ in it', () => {
          const karmaTarget = getKarmaTarget('_italics_++', user)!
          expect(karmaTarget.target).toEqual('_italics_')
        })

        it('finds the target, if it has a ` in it', () => {
          const karmaTarget = getKarmaTarget('`backticks`++', user)!
          expect(karmaTarget.target).toEqual('`backticks`')
        })

        it('finds the target, if it has a * in it', () => {
          const karmaTarget = getKarmaTarget('*bold*++', user)!
          expect(karmaTarget.target).toEqual('*bold*')
        })

        it('finds the target, if it has a ~ in it', () => {
          const karmaTarget = getKarmaTarget('~strikethrough~++', user)!
          expect(karmaTarget.target).toEqual('~strikethrough~')
        })

        it('finds the target, if it has a ^ in it', () => {
          const karmaTarget = getKarmaTarget('^.^++', user)!
          expect(karmaTarget.target).toEqual('^.^')
        })

        it("finds the target, if it has a ' in it", () => {
          const karmaTarget = getKarmaTarget("it's++", user)!
          expect(karmaTarget.target).toEqual("it's")
        })

        it('finds the target, if it has a slack username in it', () => {
          const karmaTarget = getKarmaTarget('<@UAEB34D> ++', user)!
          expect(karmaTarget.target).toEqual('<@UAEB34D>')
        })
      })

      describe('multi-word target finding', () => {
        it("finds the target, if it's multi-word, surrounded by double quotes", () => {
          const karmaTarget = getKarmaTarget('"chocolate cake"++', user)!
          expect(karmaTarget.target).toEqual('chocolate cake')
        })

        it("finds the target, if it's multi-word, surrounded by double quotes, surrounded by other words", () => {
          const karmaTarget = getKarmaTarget(
            'Yeah "chocolate cake"++, amirite?',
            user
          )!
          expect(karmaTarget.target).toEqual('chocolate cake')
        })
      })

      describe('no targets', () => {
        it('should return null if empty string', () => {
          const karmaTarget = getKarmaTarget('', user)
          expect(karmaTarget).toBeNull()
        })

        it('should return null if no matches', () => {
          const karmaTarget = getKarmaTarget('this has no incs or decs', user)
          expect(karmaTarget).toBeNull()
        })

        it('should return null if mix of + and -', () => {
          const karmaTarget = getKarmaTarget('this+-', user)
          expect(karmaTarget).toBeNull()
        })

        it('should return null if not enough +s', () => {
          const karmaTarget = getKarmaTarget('this almost has a ++', user)
          expect(karmaTarget).toBeNull()
        })

        it('should return null if not enough -s', () => {
          const karmaTarget = getKarmaTarget('this almost has a --', user)
          expect(karmaTarget).toBeNull()
        })
      })
    })

    describe('amount detection', () => {
      const testCases: [string, number][] = [
        ['target++', 1],
        ['target+++', 2],
        ['target++++', 3],
        ['target+++++', 4],
        ['target++++++', 4], // Buzzkilled
        ['target--', -1],
        ['target---', -2],
        ['target----', -3],
        ['target-----', -4],
        ['target------', -4] // Buzzkilled
      ]
      testCases.forEach(([input, expected]) => {
        it(`should detect ${expected} for "${input}"`, () => {
          const { amount } = getKarmaTarget(input, user)!
          expect(amount).toEqual(expected)
        })
      })

      it('should not detect an amount if there are no + or - signs', () => {
        const karmaTarget = getKarmaTarget('<@UAEB34D> what?', user)!
        expect(karmaTarget).toBe(null)
      })
    })

    describe('isBuzzkill detection', () => {
      const testCases: [string, boolean][] = [
        ['target++', false],
        ['target+++', false],
        ['target++++', false],
        ['target+++++', false],
        ['target++++++', true],
        ['target+++++++', true],
        ['target--', false],
        ['target---', false],
        ['target----', false],
        ['target-----', false],
        ['target------', true],
        ['target-------', true]
      ]
      testCases.forEach(([input, expected]) => {
        it(`should have isBuzzkill=${expected} for "${input}"`, () => {
          const { isBuzzkill } = getKarmaTarget(input, user)!
          expect(isBuzzkill).toBe(expected)
        })
      })
    })

    describe('isTargetingSelf detection', () => {
      it('should return true if target (without spaces) is orig user', () => {
        const { isTargetingSelf } = getKarmaTarget(`Ayyyy <@${user}>++`, user)!
        expect(isTargetingSelf).toBe(true)
      })

      it('should return true if target (with spaces) is orig user', () => {
        const { isTargetingSelf } = getKarmaTarget(`Ayyyy <@${user}> ++`, user)!
        expect(isTargetingSelf).toBe(true)
      })

      it('should return false if target (without spaces) is not user', () => {
        const { isTargetingSelf } = getKarmaTarget('Ayyyy <@UB4YUD>++', user)!
        expect(isTargetingSelf).toBe(false)
      })

      it('should return true if target (with spaces) is orig user', () => {
        const { isTargetingSelf } = getKarmaTarget('Ayyyy <@UB4YUD> ++', user)!
        expect(isTargetingSelf).toBe(false)
      })
    })

    describe('isBotCommand', () => {
      it("should return true if the input starts with the bot's userId", () => {
        expect(isBotCommand('<@UAEB42D> some-cmd', 'UAEB42D')).toBe(true)
      })

      it("should return false if the input doesn't start with the bot's userId", () => {
        expect(isBotCommand('<@UABE42D> some-cmd', 'UAEB42D')).toBe(false)
      })
    })

    describe('getBotCommand', () => {
      const botId = 'UAEB42D'

      it('should return a TOP command if the input is top', () => {
        const cmd = getBotCommand(`<@${botId}> top`)
        expect(cmd).toEqual({ type: BotCommandType.TOP })
      })

      it('should return a BOTTOM command if the input is bottom', () => {
        const cmd = getBotCommand(`<@${botId}> bottom`)
        expect(cmd).toEqual({ type: BotCommandType.BOTTOM })
      })

      it('should return a TOP_N command, with payload of `n`, if the input is top <number>', () => {
        const cmd = getBotCommand(`<@${botId}> top 5`)
        expect(cmd).toEqual({ type: BotCommandType.TOP_N, payload: 5 })
      })

      it('should return a BOTTOM_N command, with payload of `n`, if the input is bottom <number>', () => {
        const cmd = getBotCommand(`<@${botId}> bottom 5`)
        expect(cmd).toEqual({ type: BotCommandType.BOTTOM_N, payload: 5 })
      })

      it('should return a HELP command, if the input is help', () => {
        const cmd = getBotCommand(`<@${botId}> help`)
        expect(cmd).toEqual({ type: BotCommandType.HELP })
      })

      it('should fail if the `top_n` command is given a non-number arg', () => {
        const cmd = getBotCommand(`<@${botId}> top five`)
        expect(cmd).toEqual({ type: BotCommandType.UNKNOWN })
      })

      it('should fail if the `bottom_n` command is given a non-number arg', () => {
        const cmd = getBotCommand(`<@${botId}> bottom five`)
        expect(cmd).toEqual({ type: BotCommandType.UNKNOWN })
      })

      it("should return an UNKNOWN command if the command isn't recognized", () => {
        const cmd = getBotCommand(`<@${botId}> unknown-command`)
        expect(cmd).toEqual({ type: BotCommandType.UNKNOWN })
      })
    })
  })
})
