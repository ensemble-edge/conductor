- narrow most console logging to debug state (what is that?)
- add .github/workflows to test and prepare conductor releases (like edgit)
- add baseline testin info in conductor init to seed new projets w testing, incl an example in hello-world member.
Includde a template claude.md in the init installation that tells it how to use edgit and conductor
Need to add a .github folder to the conductor install template that sets up github actions that help the customer / dev push their multiverse to their cloudldflare account/workers. << this will require a bit of thinking.
- add language throught explaining that members are essentially "agents" but on steroids
- add language throught explaining that ensembles are essentially "workflows" but on steroids
- harden a/b / multivariant testing in ensembles and members
- we need a thorough cloudlfare configuration section in docs, for a fresh my-project how do you bind cf resouses. cam you/we use wrangler to do it for you?
- make sure new projects are instantly testable and that auto docs are easily bindable.
- need to configure backup models and come up with a smart way. best practice reccomendation is to have a seperate provider in case the main is down or billing is down etc
- future roadmap ideas/needs, bind to cf workflows