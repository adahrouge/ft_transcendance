/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   sort_big_utils.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/30 10:19:04 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 13:55:03 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "push_swap.h"

static int	stack_idx_mid(t_list *stack, int num)
{
	int			current;
	int			next;
	int			ret;
	const int	size = ft_lstsize(stack);

	ret = 1;
	while (stack->next)
	{
		current = ft_atoi(stack->content);
		next = ft_atoi(stack->next->content);
		if (num > current && num < next)
			break ;
		++ret;
		stack = stack->next;
	}
	if (ret >= (size + 1) / 2)
		ret = -1 * (size - ret);
	return (ret);
}

int	stack_idx_minmax(t_list *stack, int num)
{
	int			ret;
	int			x;
	const int	size = ft_lstsize(stack);

	ret = 0;
	x = stack_max(stack);
	if (num <= stack_min(stack))
		x = stack_min(stack);
	else
		++ret;
	while (stack)
	{
		if (ft_atoi(stack->content) == x)
			break ;
		++ret;
		stack = stack->next;
	}
	if (ret >= (size + 1) / 2)
		ret = -1 * (size - ret);
	return (ret);
}

void	get_min_rotate(t_list *stack_a, t_list *stack_b, int *a, int *b)
{
	int			i;
	int			j;
	int			num;
	int			x;
	const int	size_b = ft_lstsize(stack_b);

	x = 0;
	while (stack_b)
	{
		num = ft_atoi(stack_b->content);
		if (num < stack_min(stack_a) || num > stack_max(stack_a))
			i = stack_idx_minmax(stack_a, num);
		else
			i = stack_idx_mid(stack_a, num);
		j = x;
		if (x >= (size_b + 1) / 2)
			j = -1 * (size_b - x);
		if (x == 0 || count_rotate(*a, *b) > count_rotate(i, j))
		{
			*a = i;
			*b = j;
		}
		stack_b = stack_b->next;
		x++;
	}
}

void	rotate_same(t_list **stack_a, t_list **stack_b, int a, int b)
{
	if (a >= 0 && b >= 0)
	{
		run("rr", stack_a, stack_b, min(ft_abs(a), ft_abs(b)));
		if (ft_abs(a) <= ft_abs(b))
			run("rb", stack_b, NULL, ft_abs(b) - ft_abs(a));
		else
			run("ra", stack_a, NULL, ft_abs(a) - ft_abs(b));
	}
	else
	{
		run("rrr", stack_a, stack_b, min(ft_abs(a), ft_abs(b)));
		if (ft_abs(a) <= ft_abs(b))
			run("rrb", stack_b, NULL, ft_abs(b) - ft_abs(a));
		else
			run("rra", stack_a, NULL, ft_abs(a) - ft_abs(b));
	}
}

void	rotate_diff(t_list **stack_a, t_list **stack_b, int a, int b)
{
	if (a > 0 && b < 0)
	{
		run("ra", stack_a, NULL, a);
		run("rrb", stack_b, NULL, -b);
	}
	else
	{
		run("rra", stack_a, NULL, -a);
		run("rb", stack_b, NULL, b);
	}
}
