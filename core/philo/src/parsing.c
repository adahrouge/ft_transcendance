/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parsing.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:28:01 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 15:55:58 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"
// ./philo 5 800 200 200 [5]
void	parse_input(t_data *ptr, char **argv)
{
	int	counter;

	counter = 0;
	ptr->max_meals = -1;
	counter = count_argv(argv);
	string_to_int(ptr, argv, &counter);
	if (ptr->time_to_die < 6000 || ptr->time_to_eat < 6000
		|| ptr->time_to_sleep < 6000)
		error_exit("use time stamps > 60ms");
}

int	count_argv(char **argv)
{
	int	counter;

	counter = 0;
	while (argv[counter] != NULL)
		counter++;
	return (counter);
}

void	string_to_int(t_data *ptr, char **argv, int *counter)
{
	int	i;

	i = 1;
	while (argv[i] != NULL)
	{
		if (i == 1)
			ptr->philo_nb = ft_atol(argv[i]);
		else if (i == 2)
			ptr->time_to_die = ft_atol(argv[i]) * 1000;
		else if (i == 3)
			ptr->time_to_eat = ft_atol(argv[i]) * 1000;
		else if (i == 4)
			ptr->time_to_sleep = ft_atol(argv[i]) * 1000;
		else if (i == 5 && *counter == 6)
			ptr->max_meals = ft_atol(argv[i]);
		i++;
	}
}
