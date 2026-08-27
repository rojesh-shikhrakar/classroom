<script lang="ts">
	import { gradeQuiz, isQuestionCorrect } from '$lib/quiz';
	import type { QuizConfig, QuizResponse } from '$lib/types/quiz';
	let { quiz }: { quiz: QuizConfig } = $props();
	let responses = $state<Record<string, QuizResponse>>({});
	let submitted = $state(false);
	let result = $derived(submitted ? gradeQuiz(quiz, responses) : null);
	function toggle(id: string, option: string) {
		const current = Array.isArray(responses[id]) ? (responses[id] as string[]) : [];
		responses[id] = current.includes(option)
			? current.filter((value) => value !== option)
			: [...current, option];
	}
</script>

<form
	class="quiz-player"
	onsubmit={(event) => {
		event.preventDefault();
		submitted = true;
	}}
>
	<div class="quiz-intro">
		<span>Auto-graded quiz</span><strong
			>{quiz.questions.reduce((sum, q) => sum + q.points, 0)} points · {quiz.passingScore}% to pass</strong
		>
	</div>
	{#each quiz.questions as question, index (question.id)}
		<fieldset
			class:correct={submitted && isQuestionCorrect(question, responses[question.id])}
			class:incorrect={submitted && !isQuestionCorrect(question, responses[question.id])}
		>
			<legend
				>{index + 1}. {question.prompt}
				<small>{question.points} {question.points === 1 ? 'point' : 'points'}</small></legend
			>
			{#if question.type === 'fill_blank'}<label class="blank-answer"
					>Your answer<input
						required
						disabled={submitted}
						value={(responses[question.id] as string) ?? ''}
						oninput={(e) => (responses[question.id] = e.currentTarget.value)}
					/></label
				>
			{:else if question.type === 'dropdown'}<label class="blank-answer"
					>Choose an answer<select
						required
						disabled={submitted}
						value={(responses[question.id] as string) ?? ''}
						onchange={(e) => (responses[question.id] = e.currentTarget.value)}
						><option value="">Select an option</option>{#each question.options as option}<option
								value={option}>{option}</option
							>{/each}</select
					></label
				>
			{:else}{#each question.options as option}<label class="quiz-option"
						><input
							required={question.type === 'mcq'}
							disabled={submitted}
							type={question.type === 'msq' ? 'checkbox' : 'radio'}
							name={question.id}
							value={option}
							checked={question.type === 'msq'
								? ((responses[question.id] as string[] | undefined)?.includes(option) ?? false)
								: responses[question.id] === option}
							onchange={() =>
								question.type === 'msq'
									? toggle(question.id, option)
									: (responses[question.id] = option)}
						/><span>{option}</span></label
					>{/each}{/if}
			{#if submitted}<p class="answer-feedback">
					{isQuestionCorrect(question, responses[question.id])
						? 'Correct'
						: `Correct answer: ${question.answers.join(', ')}`}
				</p>{/if}
		</fieldset>
	{/each}
	{#if result}<div class:passed={result.passed} class="quiz-result" role="status">
			<strong>{result.percentage}% — {result.passed ? 'Passed' : 'Keep learning'}</strong><span
				>{result.earned} of {result.total} points</span
			>
		</div>
		<button
			type="button"
			class="secondary-action"
			onclick={() => {
				submitted = false;
				responses = {};
			}}>Try again</button
		>{:else}<button type="submit" class="primary-action">Submit answers</button>{/if}
</form>
