import { getKarmaTarget } from '../detector'

describe('detector', () => {
  describe('getKarmaTarget', () => {
    describe('target finding', () => {
      describe('simple target finding', () => {
        it('finds the target, if it is the first word in the sentence', () => {
          const karmaTarget = getKarmaTarget('Ken++')!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the target, if it is the second word in the sentence', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++')!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the target, if there are words before and after', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++, lol')!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the first target, if there are multiple in a sentence', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++ and burgers++')!
          expect(karmaTarget.target).toEqual('Ken')
        })

        it('finds the first target, if there are multiple in a sentence', () => {
          const karmaTarget = getKarmaTarget('Omg Ken++ and burgers++')!
          expect(karmaTarget.target).toEqual('Ken')
        })
      })

      describe('complex target finding', () => {
        it('finds the target, if it has letters and numbers in it', () => {
          const karmaTarget = getKarmaTarget('l33tsp3ak++')!
          expect(karmaTarget.target).toEqual('l33tsp3ak')
        })

        it('finds the target, if it is only numbers', () => {
          const karmaTarget = getKarmaTarget('411++')!
          expect(karmaTarget.target).toEqual('411')
        })

        it('finds the target, if it has a & in it', () => {
          const karmaTarget = getKarmaTarget('L&L++')!
          expect(karmaTarget.target).toEqual('L&L')
        })

        it('finds the target, if it has a $ in it', () => {
          const karmaTarget = getKarmaTarget('$$$++')!
          expect(karmaTarget.target).toEqual('$$$')
        })

        it('finds the target, if it has a ( or ) in it', () => {
          const karmaTarget = getKarmaTarget('(hello)++')!
          expect(karmaTarget.target).toEqual('(hello)')
        })

        it('finds the target, if it has a [ or ] in it', () => {
          const karmaTarget = getKarmaTarget('[hello]++')!
          expect(karmaTarget.target).toEqual('[hello]')
        })

        it('finds the target, if it has a - in it', () => {
          const karmaTarget = getKarmaTarget('lisp-case++')!
          expect(karmaTarget.target).toEqual('lisp-case')
        })

        it('finds the target, if it has a many -s in it', () => {
          const karmaTarget = getKarmaTarget('long-lisp-case++')!
          expect(karmaTarget.target).toEqual('long-lisp-case')
        })

        it('finds the target, if it has a + in it', () => {
          const karmaTarget = getKarmaTarget('a+b++')!
          expect(karmaTarget.target).toEqual('a+b')
        })

        it('finds the target, if it has a many +s in it', () => {
          const karmaTarget = getKarmaTarget('a+b+c++')!
          expect(karmaTarget.target).toEqual('a+b+c')
        })

        it('finds the target, if it has a _ in it', () => {
          const karmaTarget = getKarmaTarget('_italics_++')!
          expect(karmaTarget.target).toEqual('_italics_')
        })

        it('finds the target, if it has a ` in it', () => {
          const karmaTarget = getKarmaTarget('`backticks`++')!
          expect(karmaTarget.target).toEqual('`backticks`')
        })

        it('finds the target, if it has a * in it', () => {
          const karmaTarget = getKarmaTarget('*bold*++')!
          expect(karmaTarget.target).toEqual('*bold*')
        })

        it('finds the target, if it has a ~ in it', () => {
          const karmaTarget = getKarmaTarget('~strikethrough~++')!
          expect(karmaTarget.target).toEqual('~strikethrough~')
        })

        it('finds the target, if it has a ^ in it', () => {
          const karmaTarget = getKarmaTarget('^.^++')!
          expect(karmaTarget.target).toEqual('^.^')
        })

        it("finds the target, if it has a ' in it", () => {
          const karmaTarget = getKarmaTarget("it's++")!
          expect(karmaTarget.target).toEqual("it's")
        })

        it('finds the target, if it has a slack username in it', () => {
          const karmaTarget = getKarmaTarget('<@UAEB34D> ++')!
          expect(karmaTarget.target).toEqual('<@UAEB34D>')
        })
      })

      describe('multi-word target finding', () => {
        it("finds the target, if it's multi-word, surrounded by double quotes", () => {
          const karmaTarget = getKarmaTarget('"chocolate cake"++')!
          expect(karmaTarget.target).toEqual('chocolate cake')
        })

        it("finds the target, if it's multi-word, surrounded by double quotes, surrounded by other words", () => {
          const karmaTarget = getKarmaTarget(
            'Yeah "chocolate cake"++, amirite?'
          )!
          expect(karmaTarget.target).toEqual('chocolate cake')
        })
      })

      describe('no targets', () => {
        it('should return null if empty string', () => {
          const karmaTarget = getKarmaTarget('')
          expect(karmaTarget).toBeNull()
        })

        it('should return null if no matches', () => {
          const karmaTarget = getKarmaTarget('this has no incs or decs')
          expect(karmaTarget).toBeNull()
        })

        it('should return null if mix of + and -', () => {
          const karmaTarget = getKarmaTarget('this+-')
          expect(karmaTarget).toBeNull()
        })

        it('should return null if not enough +s', () => {
          const karmaTarget = getKarmaTarget('this almost has a ++')
          expect(karmaTarget).toBeNull()
        })

        it('should return null if not enough -s', () => {
          const karmaTarget = getKarmaTarget('this almost has a --')
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
          const { amount } = getKarmaTarget(input)!
          expect(amount).toEqual(expected)
        })
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
          const { isBuzzkill } = getKarmaTarget(input)!
          expect(isBuzzkill).toBe(expected)
        })
      })
    })
  })
})
