import { getMessage, getSelfTargetingMessage } from '../message-generator'

describe('MessageGenerator', () => {
  describe('getMessage', () => {
    describe('in Buzzkill Mode™️', () => {
      it('returns the message for delta = 1', () => {
        const message = getMessage(true, 1, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only adding 1 point.\nKen has 2 points'
        )
      })

      it('returns the message for delta = -1', () => {
        const message = getMessage(true, -1, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only subtracting 1 point.\nKen has 2 points'
        )
      })

      it('returns the message for delta > 1', () => {
        const message = getMessage(true, 4, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only adding 4 points.\nKen has 2 points'
        )
      })

      it('returns the message for delta < -1', () => {
        const message = getMessage(true, -4, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only subtracting 4 points.\nKen has 2 points'
        )
      })
    })

    describe('not in Buzzkill Mode™️', () => {
      it('returns the message for delta = 1', () => {
        const message = getMessage(false, 1, 2, 'Ken')
        expect(message).toEqual('Ken got 1 point, and now has 2')
      })

      it('returns the message for delta = -1', () => {
        const message = getMessage(false, -1, 2, 'Ken')
        expect(message).toEqual('Ken lost 1 point, and now has 2')
      })

      it('returns the message for delta > 1', () => {
        const message = getMessage(false, 4, 2, 'Ken')
        expect(message).toEqual('Ken got 4 points, and now has 2')
      })

      it('returns the message for delta < -1', () => {
        const message = getMessage(false, -4, 2, 'Ken')
        expect(message).toEqual('Ken lost 4 points, and now has 2')
      })
    })
  })

  describe('getSelfTargetingMessage', () => {
    describe('encouragement', () => {
      it('returns the first message', () => {
        const randGen = jest.fn()
        randGen
          .mockReturnValueOnce(0.1) // For the first encouragement index
          .mockReturnValue(0.75) // For the award condition to not occur
        const { message, karmaChange } = getSelfTargetingMessage(
          -1,
          'Ken',
          randGen
        )
        expect(message).toEqual("Hey, don't be so hard on yourself!")
        expect(karmaChange).toBeUndefined()
      })

      it('returns the last message', () => {
        const randGen = jest.fn()
        randGen
          .mockReturnValueOnce(0.999) // For the last encouragement index
          .mockReturnValue(0.75) // For the award condition to not occur
        const { message, karmaChange } = getSelfTargetingMessage(
          -1,
          'Ken',
          randGen
        )
        expect(message).toEqual("Chin up! Don't punish yourself too hard!")
        expect(karmaChange).toBeUndefined()
      })

      it('includes an award message, if rand conditions are met', () => {
        const randGen = jest.fn()
        randGen
          .mockReturnValueOnce(0.999) // For the encouragement index
          .mockReturnValue(0.05) // For the award conditions to occur
        const { message, karmaChange } = getSelfTargetingMessage(
          -1,
          'Ken',
          randGen
        )
        expect(message).toEqual(
          "Chin up! Don't punish yourself too hard! Ken gets 1 point, for encouragement!"
        )
        expect(karmaChange).toEqual(1)
      })
    })

    describe('punishment', () => {
      it('returns the first message', () => {
        const randGen = jest.fn()
        randGen
          .mockReturnValueOnce(0.1) // For the first punishment index
          .mockReturnValue(0.75) // For the penalty condition to not occur
        const { message, karmaChange } = getSelfTargetingMessage(
          1,
          'Ken',
          randGen
        )
        expect(message).toEqual(
          'Who do you think you are, trying to give yourself points!?'
        )
        expect(karmaChange).toBeUndefined()
      })

      it('returns the last message', () => {
        const randGen = jest.fn()
        randGen
          .mockReturnValueOnce(0.999) // For the last punishment index
          .mockReturnValue(0.75) // For the penalty condition to not occur
        const { message, karmaChange } = getSelfTargetingMessage(
          1,
          'Ken',
          randGen
        )
        expect(message).toEqual('You think you _deserve_ those points?')
        expect(karmaChange).toBeUndefined()
      })

      it('includes a penalty message, if rand conditions are met', () => {
        const randGen = jest.fn()
        randGen
          .mockReturnValueOnce(0.999) // For the punishment index
          .mockReturnValue(0.05) // For the penalty conditions to occur
        const { message, karmaChange } = getSelfTargetingMessage(
          1,
          'Ken',
          randGen
        )
        expect(message).toEqual(
          'You think you _deserve_ those points? Ken loses 1 point, for hubris!'
        )
        expect(karmaChange).toEqual(-1)
      })
    })
  })
})
