/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   push_swap.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/30 10:16:46 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 13:55:13 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <stdlib.h>
#include "push_swap.h"

static void	ps_free(char **strs)
{
	int	i;

	i = 0;
	while (strs[i])
		free(strs[i++]);
	free(strs);
}

int	main(int argc, char **argv)
{
	int		len;
	char	**strs;
	t_list	*stack;

	if (argc > 1)
	{
		strs = NULL;
		len = split_argv(&strs, argv + 1, " ");
		if (!len || !is_valid(strs))
		{
			ps_free(strs);
			ft_putendl_fd("Error", 2);
			return (1);
		}
		stack = NULL;
		while (len--)
			ft_lstadd_front(&stack, ft_lstnew(strs[len]));
		if (!is_sorted(stack))
			sort(&stack);
		ft_lstclear(&stack, free);
		free(strs);
	}
	return (0);
}
