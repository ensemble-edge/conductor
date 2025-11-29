/**
 * Version Primitives Tests
 *
 * Tests for Edgit integration - versioned component references
 */

import { describe, it, expect } from 'vitest'
import {
	componentRef,
	versionedAgent,
	versionedEnsemble,
	deploymentRef,
	versionedAgents,
	ComponentRef,
	VersionedAgent,
	VersionedEnsemble,
	DeploymentRef,
	isComponentRef,
	isVersionedAgent,
	isVersionedEnsemble,
	isDeploymentRef,
	parseVersion,
	satisfiesVersion,
} from '../../../src/primitives/version.js'

describe('Version Primitives', () => {
	describe('componentRef()', () => {
		it('should create a component reference with type, path, and version', () => {
			const ref = componentRef('agent', 'analyzers/sentiment', '1.0.0')

			expect(ref.type).toBe('agent')
			expect(ref.path).toBe('analyzers/sentiment')
			expect(ref.version).toBe('1.0.0')
		})

		it('should support different component types', () => {
			const agentRef = componentRef('agent', 'myagent', '1.0.0')
			const ensembleRef = componentRef('ensemble', 'myensemble', '2.0.0')
			const toolRef = componentRef('tool', 'mytool', '3.0.0')

			expect(agentRef.type).toBe('agent')
			expect(ensembleRef.type).toBe('ensemble')
			expect(toolRef.type).toBe('tool')
		})

		it('should support version constraints', () => {
			const compatRef = componentRef('agent', 'myagent', '^1.0.0')
			const patchRef = componentRef('agent', 'myagent', '~1.2.0')
			const latestRef = componentRef('agent', 'myagent', 'latest')

			expect(compatRef.version).toBe('^1.0.0')
			expect(patchRef.version).toBe('~1.2.0')
			expect(latestRef.version).toBe('latest')
		})

		it('should support fallback version', () => {
			const ref = componentRef('agent', 'myagent', '^2.0.0', {
				fallback: '1.9.0',
			})

			expect(ref.fallback).toBe('1.9.0')
		})

		it('should support required flag (default true)', () => {
			const ref = componentRef('agent', 'myagent', '1.0.0')
			expect(ref.required).toBe(true)

			const optionalRef = componentRef('agent', 'myagent', '1.0.0', {
				required: false,
			})
			expect(optionalRef.required).toBe(false)
		})

		it('should support resolution strategy', () => {
			const exactRef = componentRef('agent', 'myagent', '1.0.0')
			expect(exactRef.resolution).toBe('exact')

			const compatRef = componentRef('agent', 'myagent', '^1.0.0', {
				resolution: 'compatible',
			})
			expect(compatRef.resolution).toBe('compatible')

			const latestRef = componentRef('agent', 'myagent', '>=1.0.0', {
				resolution: 'latest-matching',
			})
			expect(latestRef.resolution).toBe('latest-matching')
		})
	})

	describe('ComponentRef class', () => {
		describe('getFullPath()', () => {
			it('should return type/path@version format', () => {
				const ref = componentRef('agent', 'analyzers/sentiment', '1.2.0')

				expect(ref.getFullPath()).toBe('agent/analyzers/sentiment@1.2.0')
			})
		})

		describe('toGitTag()', () => {
			it('should convert to edgit git tag format', () => {
				const agentRef = componentRef('agent', 'analyzers/sentiment', '1.0.0')
				expect(agentRef.toGitTag()).toBe('agents/analyzers/sentiment/1.0.0')

				const ensembleRef = componentRef('ensemble', 'pipelines/main', '2.0.0')
				expect(ensembleRef.toGitTag()).toBe('ensembles/pipelines/main/2.0.0')

				const toolRef = componentRef('tool', 'search', '1.0.0')
				expect(toolRef.toGitTag()).toBe('tools/search/1.0.0')
			})

			it('should handle special pluralization for query type', () => {
				// 'query' should become 'queries' not 'querys'
				const queryRef = componentRef('query', 'reports/sales', '1.0.0')
				expect(queryRef.toGitTag()).toBe('queries/reports/sales/1.0.0')
			})

			it('should handle all component types', () => {
				// Standard pluralization
				expect(componentRef('prompt', 'p', '1.0.0').toGitTag()).toBe('prompts/p/1.0.0')
				expect(componentRef('schema', 's', '1.0.0').toGitTag()).toBe('schemas/s/1.0.0')
				expect(componentRef('template', 't', '1.0.0').toGitTag()).toBe('templates/t/1.0.0')
				expect(componentRef('config', 'c', '1.0.0').toGitTag()).toBe('configs/c/1.0.0')
				expect(componentRef('script', 'x', '1.0.0').toGitTag()).toBe('scripts/x/1.0.0')
			})
		})

		describe('toVersionReference()', () => {
			it('should convert to VersionReference interface', () => {
				const ref = componentRef('agent', 'myagent', '1.0.0')
				const versionRef = ref.toVersionReference()

				expect(versionRef.type).toBe('agent')
				expect(versionRef.path).toBe('myagent')
				expect(versionRef.version).toBe('1.0.0')
			})
		})

		describe('toConfig()', () => {
			it('should return a config object for serialization', () => {
				const ref = componentRef('agent', 'myagent', '^1.0.0', {
					fallback: '0.9.0',
					required: false,
					resolution: 'compatible',
				})

				const config = ref.toConfig()

				expect(config.type).toBe('agent')
				expect(config.path).toBe('myagent')
				expect(config.version).toBe('^1.0.0')
				expect(config.fallback).toBe('0.9.0')
				expect(config.required).toBe(false)
				expect(config.resolution).toBe('compatible')
			})

			it('should omit defaults from config', () => {
				const ref = componentRef('agent', 'myagent', '1.0.0')

				const config = ref.toConfig()

				expect(config.fallback).toBeUndefined()
				expect(config.required).toBeUndefined() // required=true is default
				expect(config.resolution).toBeUndefined() // exact is default
			})
		})
	})

	describe('versionedAgent()', () => {
		it('should create a versioned agent reference', () => {
			const agent = versionedAgent('analyzers/sentiment', '1.0.0')

			expect(agent.type).toBe('agent')
			expect(agent.path).toBe('analyzers/sentiment')
			expect(agent.version).toBe('1.0.0')
		})

		it('should support config override', () => {
			const agent = versionedAgent('analyzer', '^1.0.0', {
				config: {
					model: 'claude-sonnet-4',
					temperature: 0.5,
				},
			})

			expect(agent.agentConfig).toEqual({
				model: 'claude-sonnet-4',
				temperature: 0.5,
			})
		})

		it('should support input mapping', () => {
			const agent = versionedAgent('analyzer', '1.0.0', {
				input: {
					text: '${input.content}',
				},
			})

			expect(agent.input).toEqual({
				text: '${input.content}',
			})
		})

		describe('toFlowStep()', () => {
			it('should convert to agent flow step format', () => {
				const agent = versionedAgent('analyzer', '1.0.0')
				const step = agent.toFlowStep()

				expect(step.agent).toBe('analyzer')
				expect(step.version).toBe('1.0.0')
			})

			it('should include config and input in flow step', () => {
				const agent = versionedAgent('analyzer', '1.0.0', {
					config: { model: 'claude-sonnet-4' },
					input: { text: '${input.content}' },
				})

				const step = agent.toFlowStep()

				expect(step.config).toEqual({ model: 'claude-sonnet-4' })
				expect(step.input).toEqual({ text: '${input.content}' })
			})
		})
	})

	describe('versionedEnsemble()', () => {
		it('should create a versioned ensemble reference', () => {
			const ensemble = versionedEnsemble('pipelines/main', '1.0.0')

			expect(ensemble.type).toBe('ensemble')
			expect(ensemble.path).toBe('pipelines/main')
			expect(ensemble.version).toBe('1.0.0')
		})

		it('should support input mapping', () => {
			const ensemble = versionedEnsemble('pipeline', '1.0.0', {
				input: {
					data: '${preprocess.output}',
				},
			})

			expect(ensemble.input).toEqual({
				data: '${preprocess.output}',
			})
		})

		it('should support inheritState option', () => {
			const ensemble = versionedEnsemble('pipeline', '1.0.0', {
				inheritState: true,
			})

			expect(ensemble.inheritState).toBe(true)

			const noInherit = versionedEnsemble('pipeline', '1.0.0')
			expect(noInherit.inheritState).toBe(false)
		})

		describe('toInvocation()', () => {
			it('should convert to ensemble invocation format', () => {
				const ensemble = versionedEnsemble('pipeline', '1.0.0')
				const invocation = ensemble.toInvocation()

				expect(invocation.ensemble).toBe('pipeline')
				expect(invocation.version).toBe('1.0.0')
			})

			it('should include input and inheritState in invocation', () => {
				const ensemble = versionedEnsemble('pipeline', '1.0.0', {
					input: { data: '${input.data}' },
					inheritState: true,
				})

				const invocation = ensemble.toInvocation()

				expect(invocation.input).toEqual({ data: '${input.data}' })
				expect(invocation.inheritState).toBe(true)
			})
		})
	})

	describe('deploymentRef()', () => {
		it('should create a deployment reference', () => {
			const component = componentRef('agent', 'analyzer', 'latest')
			const deploy = deploymentRef(component, 'production')

			expect(deploy.component).toBe(component)
			expect(deploy.environment).toBe('production')
		})

		it('should support fallback environment', () => {
			const component = componentRef('agent', 'analyzer', 'latest')
			const deploy = deploymentRef(component, 'staging', {
				fallback: 'production',
			})

			expect(deploy.fallback).toBe('production')
		})

		it('should support required flag', () => {
			const component = componentRef('agent', 'analyzer', 'latest')

			const requiredDeploy = deploymentRef(component, 'production')
			expect(requiredDeploy.required).toBe(true)

			const optionalDeploy = deploymentRef(component, 'canary', {
				required: false,
			})
			expect(optionalDeploy.required).toBe(false)
		})

		describe('toDeploymentTag()', () => {
			it('should return deployment tag format', () => {
				const component = componentRef('agent', 'analyzer', 'latest')
				const deploy = deploymentRef(component, 'production')

				expect(deploy.toDeploymentTag()).toBe('deploy/production/agents/analyzer')
			})

			it('should handle ensemble type', () => {
				const component = componentRef('ensemble', 'pipeline', 'latest')
				const deploy = deploymentRef(component, 'staging')

				expect(deploy.toDeploymentTag()).toBe('deploy/staging/ensembles/pipeline')
			})
		})

		describe('toConfig()', () => {
			it('should return config for serialization', () => {
				const component = componentRef('agent', 'analyzer', '^1.0.0')
				const deploy = deploymentRef(component, 'production', {
					fallback: 'staging',
					required: false,
				})

				const config = deploy.toConfig()

				expect(config.component.type).toBe('agent')
				expect(config.component.path).toBe('analyzer')
				expect(config.environment).toBe('production')
				expect(config.fallback).toBe('staging')
				expect(config.required).toBe(false)
			})
		})
	})

	describe('versionedAgents()', () => {
		it('should create multiple versioned agents from specs', () => {
			const agents = versionedAgents({
				preprocessor: '2.1.0',
				analyzer: '^1.0.0',
				formatter: '~1.2.0',
			})

			expect(agents.preprocessor.version).toBe('2.1.0')
			expect(agents.analyzer.version).toBe('^1.0.0')
			expect(agents.formatter.version).toBe('~1.2.0')
		})

		it('should support object specs with options', () => {
			const agents = versionedAgents({
				simple: '1.0.0',
				complex: {
					version: '^2.0.0',
					options: {
						config: { model: 'claude-sonnet-4' },
					},
				},
			})

			expect(agents.simple.version).toBe('1.0.0')
			expect(agents.simple.agentConfig).toBeUndefined()
			expect(agents.complex.version).toBe('^2.0.0')
			expect(agents.complex.agentConfig).toEqual({ model: 'claude-sonnet-4' })
		})
	})

	describe('Type Guards', () => {
		describe('isComponentRef()', () => {
			it('should return true for ComponentRef instances', () => {
				const ref = componentRef('agent', 'myagent', '1.0.0')
				expect(isComponentRef(ref)).toBe(true)
			})

			it('should return true for VersionedAgent instances', () => {
				const agent = versionedAgent('myagent', '1.0.0')
				expect(isComponentRef(agent)).toBe(true)
			})

			it('should return false for non-ComponentRef values', () => {
				expect(isComponentRef(null)).toBe(false)
				expect(isComponentRef('string')).toBe(false)
				expect(isComponentRef({})).toBe(false)
			})

			it('should return true for objects with __isComponentRef marker', () => {
				const fakeRef = { __isComponentRef: true, type: 'agent', path: 'x', version: '1.0.0' }
				expect(isComponentRef(fakeRef)).toBe(true)
			})
		})

		describe('isVersionedAgent()', () => {
			it('should return true for VersionedAgent instances', () => {
				const agent = versionedAgent('myagent', '1.0.0')
				expect(isVersionedAgent(agent)).toBe(true)
			})

			it('should return false for plain ComponentRef', () => {
				const ref = componentRef('agent', 'myagent', '1.0.0')
				expect(isVersionedAgent(ref)).toBe(false)
			})
		})

		describe('isVersionedEnsemble()', () => {
			it('should return true for VersionedEnsemble instances', () => {
				const ensemble = versionedEnsemble('pipeline', '1.0.0')
				expect(isVersionedEnsemble(ensemble)).toBe(true)
			})

			it('should return false for plain ComponentRef', () => {
				const ref = componentRef('ensemble', 'pipeline', '1.0.0')
				expect(isVersionedEnsemble(ref)).toBe(false)
			})
		})

		describe('isDeploymentRef()', () => {
			it('should return true for DeploymentRef instances', () => {
				const component = componentRef('agent', 'analyzer', 'latest')
				const deploy = deploymentRef(component, 'production')
				expect(isDeploymentRef(deploy)).toBe(true)
			})

			it('should return false for non-DeploymentRef values', () => {
				expect(isDeploymentRef(null)).toBe(false)
				expect(isDeploymentRef(componentRef('agent', 'x', '1.0.0'))).toBe(false)
			})
		})
	})

	describe('Utility Functions', () => {
		describe('parseVersion()', () => {
			it('should parse exact version', () => {
				const result = parseVersion('1.2.3')

				expect(result.major).toBe(1)
				expect(result.minor).toBe(2)
				expect(result.patch).toBe(3)
				expect(result.constraint).toBeUndefined()
			})

			it('should parse caret constraint', () => {
				const result = parseVersion('^1.2.0')

				expect(result.constraint).toBe('^')
				expect(result.major).toBe(1)
				expect(result.minor).toBe(2)
				expect(result.patch).toBe(0)
			})

			it('should parse tilde constraint', () => {
				const result = parseVersion('~1.2.0')

				expect(result.constraint).toBe('~')
				expect(result.major).toBe(1)
			})

			it('should parse >=  constraint', () => {
				const result = parseVersion('>=2.0.0')

				expect(result.constraint).toBe('>=')
				expect(result.major).toBe(2)
			})

			it('should handle special tags', () => {
				expect(parseVersion('latest')).toEqual({ tag: 'latest' })
				expect(parseVersion('stable')).toEqual({ tag: 'stable' })
			})
		})

		describe('satisfiesVersion()', () => {
			it('should match exact versions', () => {
				expect(satisfiesVersion('1.2.3', '1.2.3')).toBe(true)
				expect(satisfiesVersion('1.2.3', '1.2.4')).toBe(false)
			})

			it('should match caret constraint (compatible)', () => {
				expect(satisfiesVersion('1.2.3', '^1.0.0')).toBe(true)
				expect(satisfiesVersion('1.0.0', '^1.0.0')).toBe(true)
				expect(satisfiesVersion('1.9.9', '^1.0.0')).toBe(true)
				expect(satisfiesVersion('2.0.0', '^1.0.0')).toBe(false)
				expect(satisfiesVersion('0.9.0', '^1.0.0')).toBe(false)
			})

			it('should match tilde constraint (patch-compatible)', () => {
				expect(satisfiesVersion('1.2.3', '~1.2.0')).toBe(true)
				expect(satisfiesVersion('1.2.0', '~1.2.0')).toBe(true)
				expect(satisfiesVersion('1.2.9', '~1.2.0')).toBe(true)
				expect(satisfiesVersion('1.3.0', '~1.2.0')).toBe(false)
				expect(satisfiesVersion('1.1.0', '~1.2.0')).toBe(false)
			})

			it('should match >= constraint', () => {
				expect(satisfiesVersion('2.0.0', '>=1.0.0')).toBe(true)
				expect(satisfiesVersion('1.0.0', '>=1.0.0')).toBe(true)
				expect(satisfiesVersion('0.9.0', '>=1.0.0')).toBe(false)
			})

			it('should match <= constraint', () => {
				expect(satisfiesVersion('1.0.0', '<=2.0.0')).toBe(true)
				expect(satisfiesVersion('2.0.0', '<=2.0.0')).toBe(true)
				expect(satisfiesVersion('2.0.1', '<=2.0.0')).toBe(false)
			})

			it('should always match latest/stable', () => {
				expect(satisfiesVersion('1.0.0', 'latest')).toBe(true)
				expect(satisfiesVersion('99.0.0', 'stable')).toBe(true)
			})

			it('should handle tag versions', () => {
				expect(satisfiesVersion('latest', 'latest')).toBe(true)
				// When constraint is 'latest' or 'stable', any version satisfies it
				expect(satisfiesVersion('latest', 'stable')).toBe(true)
				// Non-semver tags only match exactly when constraint is also a tag
				expect(satisfiesVersion('beta', 'beta')).toBe(true)
				expect(satisfiesVersion('beta', 'alpha')).toBe(false)
			})
		})
	})

	describe('Integration Scenarios', () => {
		it('should compose versioned ensembles with versioned agents', () => {
			// This is how you'd compose versioned components in an ensemble
			const agents = versionedAgents({
				preprocessor: '2.1.0',
				analyzer: '^1.0.0',
			})

			const steps = [
				agents.preprocessor.toFlowStep(),
				agents.analyzer.toFlowStep(),
			]

			expect(steps[0].agent).toBe('preprocessor')
			expect(steps[0].version).toBe('2.1.0')
			expect(steps[1].agent).toBe('analyzer')
			expect(steps[1].version).toBe('^1.0.0')
		})

		it('should support deployment-based version resolution', () => {
			const analyzer = versionedAgent('analyzers/sentiment', 'latest')
			const prodDeployment = deploymentRef(analyzer, 'production')
			const stagingDeployment = deploymentRef(analyzer, 'staging', {
				fallback: 'production',
			})

			expect(prodDeployment.toDeploymentTag()).toBe('deploy/production/agents/analyzers/sentiment')
			expect(stagingDeployment.fallback).toBe('production')
		})

		it('should convert to Git tags compatible with edgit', () => {
			const ref = versionedAgent('data-processor', '1.0.0')
			const gitTag = ref.toGitTag()

			// Should match edgit's namespace format: agents/<name>/<version>
			expect(gitTag).toBe('agents/data-processor/1.0.0')
		})
	})
})
