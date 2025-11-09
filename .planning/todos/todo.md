
- add .github/workflows to test and prepare conductor releases (like edgit)

-Need to add a .github folder to the conductor install template that sets up github actions that help the customer / dev push their multiverse to their cloudldflare account/workers. << this will require a bit of thinking.
- harden a/b / multivariant testing in ensembles and members
- we need a thorough cloudlfare configuration section in docs, for a fresh my-project how do you bind cf resouses. cam you/we use wrangler to do it for you?
- make sure auto docs are easily bindable and accessible via /docs/ (password optionsl?).
- need to configure backup models and come up with a smart way. best practice reccomendation is to have a seperate provider in case the main is down or billing is do wn etc
- future roadmap ideas/needs, bind to cf workflows