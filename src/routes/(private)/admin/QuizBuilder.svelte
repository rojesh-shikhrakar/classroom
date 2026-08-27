<script lang="ts">
	import type { QuizConfig, QuizQuestion, QuizQuestionType } from '$lib/types/quiz';

	let { quiz = $bindable() }: { quiz: QuizConfig } = $props();
	const labels: Record<QuizQuestionType, string> = {
		mcq: 'Multiple choice',
		msq: 'Multiple select',
		dropdown: 'Dropdown',
		fill_blank: 'Fill in the blank'
	};
	function addQuestion() {
		quiz = {
			...quiz,
			questions: [
				...quiz.questions,
				{
					id: crypto.randomUUID(),
					type: 'mcq',
					prompt: '',
					options: ['', ''],
					answers: [],
					points: 1
				}
			]
		};
	}
	function update(id: string, change: Partial<QuizQuestion>) {
		quiz = {
			...quiz,
			questions: quiz.questions.map((q) => (q.id === id ? { ...q, ...change } : q))
		};
	}
	function setType(question: QuizQuestion, type: QuizQuestionType) {
		update(question.id, {
			type,
			options: type === 'fill_blank' ? [] : question.options.length ? question.options : ['', ''],
			answers: []
		});
	}
	function setOption(question: QuizQuestion, index: number, value: string) {
		const old = question.options[index];
		const options = question.options.map((option, i) => (i === index ? value : option));
		const answers = question.answers.map((answer) => (answer === old ? value : answer));
		update(question.id, { options, answers });
	}
	function toggleAnswer(question: QuizQuestion, option: string) {
		const selected = question.answers.includes(option);
		update(question.id, {
			answers:
				question.type === 'msq'
					? selected
						? question.answers.filter((a) => a !== option)
						: [...question.answers, option]
					: [option]
		});
	}
</script>

<section class="quiz-builder" aria-labelledby="quiz-builder-title">
	<div class="quiz-builder-head">
		<div>
			<h3 id="quiz-builder-title">Quiz questions</h3>
			<p>Set the correct answer for automatic grading.</p>
		</div>
		<label
			>Pass mark <span
				><input type="number" min="0" max="100" bind:value={quiz.passingScore} />%</span
			></label
		>
	</div>
	{#each quiz.questions as question, questionIndex (question.id)}
		<fieldset class="question-card">
			<legend>Question {questionIndex + 1}</legend>
			<div class="question-top">
				<label
					>Question type<select
						value={question.type}
						onchange={(e) => setType(question, e.currentTarget.value as QuizQuestionType)}
						>{#each Object.entries(labels) as [value, label]}<option {value}>{label}</option
							>{/each}</select
					></label
				><label
					>Points<input
						type="number"
						min="1"
						max="100"
						value={question.points}
						oninput={(e) => update(question.id, { points: Number(e.currentTarget.value) })}
					/></label
				><button
					type="button"
					class="danger-link"
					onclick={() =>
						(quiz = { ...quiz, questions: quiz.questions.filter((q) => q.id !== question.id) })}
					>Remove</button
				>
			</div>
			<label
				>Question prompt<input
					required
					value={question.prompt}
					oninput={(e) => update(question.id, { prompt: e.currentTarget.value })}
					placeholder={question.type === 'fill_blank'
						? 'Complete the sentence…'
						: 'Ask a clear question…'}
				/></label
			>
			{#if question.type === 'fill_blank'}
				<label
					>Accepted answer<input
						required
						value={question.answers[0] ?? ''}
						oninput={(e) => update(question.id, { answers: [e.currentTarget.value] })}
						placeholder="Answer (capitalization is ignored)"
					/></label
				>
			{:else}
				<div class="option-list">
					<span>Answer options</span>{#each question.options as option, optionIndex}<div
							class="option-row"
						>
							<input
								aria-label={`Mark option ${optionIndex + 1} correct`}
								type={question.type === 'msq' ? 'checkbox' : 'radio'}
								name={`answer-${question.id}`}
								checked={question.answers.includes(option) && option !== ''}
								onchange={() => toggleAnswer(question, option)}
							/><input
								required
								aria-label={`Option ${optionIndex + 1}`}
								value={option}
								oninput={(e) => setOption(question, optionIndex, e.currentTarget.value)}
								placeholder={`Option ${optionIndex + 1}`}
							/><button
								type="button"
								aria-label={`Remove option ${optionIndex + 1}`}
								disabled={question.options.length <= 2}
								onclick={() =>
									update(question.id, {
										options: question.options.filter((_, i) => i !== optionIndex),
										answers: question.answers.filter((a) => a !== option)
									})}>×</button
							>
						</div>{/each}<button
						type="button"
						class="add-option"
						onclick={() => update(question.id, { options: [...question.options, ''] })}
						>+ Add option</button
					>
				</div>
			{/if}
		</fieldset>
	{/each}
	<button type="button" class="secondary add-question" onclick={addQuestion}>+ Add question</button>
</section>
