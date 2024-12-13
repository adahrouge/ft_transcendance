/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   sort_utils.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/30 10:19:10 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 13:54:55 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "push_swap.h"

int	stack_min(t_list *stack)
{
	int	min;
	int	num;

	min = ft_atoi(stack->content);
	while (stack)
	{
		num = ft_atoi(stack->content);
		if (min > num)
			min = num;
		stack = stack->next;
	}
	return (min);
}

int	stack_max(t_list *stack)
{
	int	max;
	int	num;

	max = ft_atoi(stack->content);
	while (stack)
	{
		num = ft_atoi(stack->content);
		if (max < num)
			max = num;
		stack = stack->next;
	}
	return (max);
}

int	min(int a, int b)
{
	if (a <= b)
		return (a);
	return (b);
}

int	count_rotate(int a, int b)
{
	if ((a >= 0 && b >= 0) || (a <= 0 && b <= 0))
		return (min(ft_abs(a), ft_abs(b)) + ft_abs(a - b));
	return (ft_abs(a) + ft_abs(b));
}
