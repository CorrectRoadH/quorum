import type { AdviceLetters } from './letter.ts'

/* ==========================================================================
   Investor and mentor advice (GDD 18). Investors write from a pool of funds;
   mentors from a pool of advisors, so each letter signs with `from`.
   ========================================================================== */

export const PEOPLE: Pick<AdviceLetters, 'round' | 'research' | 'ipo' | 'grow'> = {
  round: [
    ({ from, round }) => ({
      subject: `Quick intro: ${from} x your ${round}`,
      body: `Hi there,\n\nLong-time lurker, first-time emailer. We love what you are building. Like, really love it. Three partners screenshotted your Board this morning and one of them cried a little.\n\nWe lead rounds, and we would like to lead your ${round}. Would love to grab coffee, or a call, or a walk, whichever moves fastest.\n\nIf you are ready, hit Raise. If the timing is wrong, Decline, and we will pretend to be fine about it.\n\nWarmly,\nA partner at ${from}`,
    }),
    ({ from, round }) => ({
      subject: `${round}: we're in. Are you?`,
      body: `Founder,\n\nKeeping this short because the market is not waiting. Other funds are circling your ${round} round. We would rather lead it than read about it.\n\nRaise, and we move today.\nDecline, and we will be here, refreshing your metrics.\n\nSent from my phone, which is how all conviction is sent\n${from}`,
    }),
    ({ from, round }) => ({
      subject: `On the long arc of your ${round}`,
      body: `Dear founder,\n\nAt ${from} we do not invest in companies. We invest in decades. We have watched many Boards come and go, and yours has the quiet look of something that will still be running when our grandchildren's funds are raising.\n\nWe would be honoured to lead your ${round} round. Patient capital, aligned incentives, and a board seat we promise to use sparingly.\n\nShould you wish to proceed, choose Raise. Should you not, Decline, and we shall wait. We are very good at waiting.\n\nWith respect,\nThe partners of ${from}`,
    }),
    ({ from, round }) => ({
      subject: `Make something users want. Then raise.`,
      body: `Hi,\n\nSome notes from our side:\n\n- Default alive beats default dead.\n- Do things that don't scale, then scale them.\n- Raise when someone offers.\n\nSomeone is offering. ${from} wants to lead your ${round} round.\n\nRaise if you want the money. Decline if you would rather keep building on instant noodles. Both are fine. One is faster.\n\n${from}`,
    }),
    ({ from, round }) => ({
      subject: `Re: Re: your ${round} (bumping this up)`,
      body: `Hey! Just floating this back to the top of your inbox in case it got buried under your 3 a.m. alerts.\n\nTL;DR: we would love to lead your ${round} round. We are founder-friendly, operator-led, thesis-driven, and every other hyphenated word on our website.\n\nNo pressure. (Some pressure.) Raise, and the paperwork lands before you finish your coffee. Decline, and we will circle back next quarter, as is tradition.\n\nCheers,\nThe ${from} team\n\nP.S. Loved your last commit message.`,
    }),
  ],

  research: [
    ({ from }) => ({
      subject: `Insight is for spending`,
      body: `Dear founder,\n\nYou have been saving Insight the way some people save string: carefully, and for no reason anyone can name. You have enough now to research something.\n\nOpen Research and spend it. Knowledge that sits in a drawer is not knowledge. It is a drawer.\n\nYours,\n${from}`,
    }),
    ({ from }) => ({
      subject: `A short note on Insight`,
      body: `Founder,\n\nYou have enough Insight to research something. You have not.\n\nUnspent Insight is a lesson you paid for and then declined to attend.\n\nOpen Research. Spend your Insight. Then return to work.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Something I learned the slow way`,
      body: `Hello,\n\nEarly in my career I kept a notebook of things I meant to learn properly. By the time I opened it, half the entries were obsolete and the other half were the causes of my outages.\n\nYou are keeping that notebook now. You have enough Insight to research something.\n\nOpen Research and spend your Insight. Pick the thing that bit you most recently. It will bite less.\n\nWarmly,\n${from}\n\nP.S. Yes, I still have the notebook. No, you cannot see it.`,
    }),
    ({ from }) => ({
      subject: `Three questions before you build more`,
      body: `Dear founder,\n\nBefore you place another Node, ask yourself:\n\n1. What broke last?\n2. Do I understand why?\n3. Could I learn something so it never breaks that way again?\n\nThe answer to the third is yes. You have enough Insight to research something. Open Research and spend your Insight.\n\nWith regards,\n${from}`,
    }),
    ({ from }) => ({
      subject: `You are allowed to learn things`,
      body: `Founder,\n\nA ship in harbour is safe, but that is not what ships are for. Insight in your pocket is safe too, and it is doing exactly as much.\n\nYou have enough to research something. Open Research, spend your Insight, and go find out what you have been guessing at.\n\nOnward,\n${from}`,
    }),
  ],

  ipo: [
    ({ from, users }) => ({
      subject: `The bell is not rung by accident`,
      body: `Dear founder,\n\nPeople imagine going public as a single morning: a bell, a balloon drop, a photograph. It is not. It is a long list of dull things done well.\n\nYour two dull things are these: grow to ${users} users, and clear the IPO checklist. Then you may have your bell.\n\nWith great expectations,\n${from}`,
    }),
    ({ from, users }) => ({
      subject: `Public is a promise`,
      body: `Founder,\n\nA private company may be wrong in private. A public one is wrong in the newspaper.\n\nTo go public, grow to ${users} users and clear the IPO checklist. Both, not one. The market can count, and it reads checklists.\n\n${from}`,
    }),
    ({ from, users }) => ({
      subject: `On IPOs, and on patience`,
      body: `Hello again,\n\nI was asked once what separates a company that goes public from one that merely wants to. My answer then, and now: the boring part.\n\nThe exciting part is the user count. Grow to ${users} users. The boring part is the IPO checklist, and you must clear all of it. Founders who skip the boring part become case studies, and I have taught enough of those.\n\nDo both, and you can go public.\n\nFondly,\n${from}`,
    }),
    ({ from, users }) => ({
      subject: `Your road to going public`,
      body: `Dear founder,\n\nWhere you are going:\nPublic.\n\nWhat stands between you and it:\n- ${users} users. Grow until you have them.\n- The IPO checklist. Clear every line.\n\nWhat does not stand between you and it:\n- A nicer logo.\n- A bigger office.\n- My approval, which you already have.\n\nGo.\n${from}`,
    }),
    ({ from, users }) => ({
      subject: `Before the bell, the work`,
      body: `Founder,\n\nOne day someone will ask you to explain your whole system in a single slide. You will be tempted to use forty. Resist.\n\nBut first, earn the question. Grow to ${users} users and clear the IPO checklist to go public. The first proves people want it. The second proves you can be trusted with it.\n\nI am proud of how far you have come. Do not tell anyone I said so.\n\n${from}`,
    }),
  ],

  grow: [
    ({ from, round, users }) => ({
      subject: `The ${round} round is ${users} users away`,
      body: `Dear founder,\n\nYou will want to raise the ${round} round now. Everyone does. But money follows users, not wishes.\n\nGrow to ${users} users, and the ${round} round will come to you. Until then, keep the Design healthy and the users happy.\n\nPatiently,\n${from}`,
    }),
    ({ from, round, users }) => ({
      subject: `Not yet.`,
      body: `Founder,\n\nNot yet.\n\nGrow to ${users} users. Then raise the ${round} round.\n\nA fundraise before its time is a distraction with paperwork attached. I will not elaborate. You will not need me to.\n\n${from}`,
    }),
    ({ from, round, users }) => ({
      subject: `What I would do in your seat`,
      body: `Hello,\n\nYou were about to ask, so here is what I would do in your seat:\n\n- Stop refreshing the investor pages.\n- Watch what slows your users down, and fix it.\n- Grow to ${users} users.\n- Then raise the ${round} round, from strength.\n\nThat is the whole plan. Plans that fit in four lines are the only ones I trust.\n\nWarmly,\n${from}`,
    }),
    ({ from, round, users }) => ({
      subject: `A word about the ${round} round`,
      body: `Dear founder,\n\nI have sat on both sides of the table. The founders who raised well did not have the best decks. They walked in already needing the money, because the users had arrived first.\n\nGrow to ${users} users to raise the ${round} round. Let your users make the argument. It is the only one investors cannot interrupt.\n\nWith confidence in you,\n${from}`,
    }),
    ({ from, round, users }) => ({
      subject: `Users first, then the ${round}`,
      body: `Founder,\n\nThe order of things matters more than the things. Users, then money. Never money, then users.\n\nYou need ${users} users to raise the ${round} round. Every user you serve well tells a friend. Every user you serve slowly tells a friend too, just differently.\n\nBuild for them. The round will keep.\n\nYours, in no particular hurry,\n${from}`,
    }),
  ],
}
