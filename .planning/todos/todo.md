
- add .github/workflows to test and prepare conductor releases (like edgit)

-Need to add a .github folder to the conductor install template that sets up github actions that help the customer / dev push their multiverse to their cloudldflare account/workers. << this will require a bit of thinking.
- harden a/b / multivariant testing in ensembles and members
- we need a thorough cloudlfare configuration section in docs, for a fresh my-project how do you bind cf resouses. cam you/we use wrangler to do it for you?
is to have a seperate provider in case the main is down or billing is do wn etc
- future roadmap ideas/needs, bind to cf workflows
- add image processing, both analysis and generation
- add audio processing, both analysis and generation
- add graph or chart generation
- undo this, i don't like it (rethink tests for default project after init):
    I created two ways to import Conductor: 
    @ensemble-edge/conductor - Regular import, works everywhere (tests, local dev, CI/CD)
    Does NOT include Durable Objects
    Perfect for testing
    @ensemble-edge/conductor/cloudflare - Cloudflare-specific import
    DOES include Durable Objects
    Only use in your Cloudflare Workers src/index.ts
- Consider Cloudflare remote bindings

- make sure ml operation is implemented like in docs
- make sure functinality in docs matches code (major recinciliation needs to happen)

- make sure auto docs are easily bindable and accessible via /docs/ (password optionsl?).
- need to configure backup models and come up with a smart way. best practice reccomendation 

Add new query protocol vs updating current one
Add graphql to ComponentProtocol type
Add graphql/ prefix mapping in ComponentLoader
Update edgit CLI to recognize graphql components
Add tests