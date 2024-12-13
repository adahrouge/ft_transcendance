/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   instructions.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/30 10:18:41 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 13:55:50 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "push_swap.h"

static void	sx(t_list **stack_1, t_list **stack_2)
{
	t_list	*tmp;

	(void)stack_2;
	if (ft_lstsize(*stack_1) >= 2)
	{
		tmp = (*stack_1)->next;
		(*stack_1)->next = tmp->next;
		ft_lstadd_front(stack_1, tmp);
	}
}

static void	px(t_list **stack_1, t_list **stack_2)
{
	t_list	*tmp;

	if (ft_lstsize(*stack_1))
	{
		tmp = *stack_1;
		*stack_1 = (*stack_1)->next;
		ft_lstadd_front(stack_2, tmp);
	}
}

static void	rx(t_list **stack_1, t_list **stack_2)
{
	t_list	*tmp;

	(void)stack_2;
	if (ft_lstsize(*stack_1) >= 2)
	{
		tmp = *stack_1;
		*stack_1 = (*stack_1)->next;
		tmp->next = NULL;
		ft_lstadd_back(stack_1, tmp);
	}
}

static void	rrx(t_list **stack_1, t_list **stack_2)
{
	t_list	*last;
	t_list	*tmp;

	(void)stack_2;
	if (ft_lstsize(*stack_1) >= 2)
	{
		last = *stack_1;
		while (last->next)
		{
			tmp = last;
			last = last->next;
		}
		tmp->next = NULL;
		last->next = *stack_1;
		*stack_1 = last;
	}
}

void	run(char *cmd, t_list **stack_1, t_list **stack_2, int x)
{
	int			tmp;
	void		(*f)(t_list **, t_list **);
	const int	len = ft_strlen(cmd);

	tmp = ft_abs(x);
	if (!ft_strncmp(cmd, "sa", len) || !ft_strncmp(cmd, "sb", len)
		|| !ft_strncmp(cmd, "ss", len))
		f = &sx;
	else if (!ft_strncmp(cmd, "pa", len) || !ft_strncmp(cmd, "pb", len))
		f = &px;
	else if (!ft_strncmp(cmd, "ra", len) || !ft_strncmp(cmd, "rb", len)
		|| !ft_strncmp(cmd, "rr", len))
		f = &rx;
	else
		f = &rrx;
	while (tmp--)
	{
		f(stack_1, stack_2);
		if (stack_2 && f != px)
			f(stack_2, NULL);
		if (x > 0)
			ft_putendl_fd(cmd, 1);
	}
}
